using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.Constants;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Application.Services.TaxEngine.DynamicTax
{
    /// <summary>
    /// Orders a run's taxes so that a tax priced as a PERCENT of another tax (<c>ResultBase =
    /// </c><see cref="DynamicTaxResultBases.OtherTax"/>) is always computed AFTER the tax it
    /// references.
    ///
    /// <para>
    /// Needed because <see cref="DynamicTaxResultBases.OtherTax"/> reads an amount produced in the
    /// same calculation run — the RV pipeline's plain <c>foreach</c> over taxes carries no ordering
    /// guarantee, so without this a reference would resolve to zero or not, depending on TaxMaster
    /// row order.
    /// </para>
    /// </summary>
    public static class DynamicTaxOrdering
    {
        /// <summary>
        /// Returns <paramref name="taxes"/> in dependency order (referenced taxes first), preserving
        /// the input order among taxes that do not depend on each other.
        ///
        /// <para>
        /// Never throws. When no tax is ready to place, <c>remaining</c> can contain both the actual
        /// reference-cycle members AND taxes merely downstream of that cycle (they depend on a cycle
        /// member, not on each other) — appending all of <c>remaining</c> in input order would risk
        /// running a downstream tax before the dependency it — genuinely, acyclically — needs,
        /// making it resolve to zero for no reason. Instead only the true cycle component is
        /// identified, logged, and force-placed (its internal references then fail to resolve and
        /// contribute zero, which is unavoidable), and ordering continues normally so downstream
        /// taxes are still placed after it.
        /// </para>
        /// </summary>
        public static List<TaxMasterEntity> Order(
            IReadOnlyList<TaxMasterEntity> taxes,
            DynamicTaxConfigSnapshot config,
            ILogger logger)
        {
            var taxIds = taxes.Select(t => t.Id).ToHashSet();

            // Dependencies only ever come from condition rows; a tax with none needs no ordering.
            // References to taxes outside this run (inactive, or an EDU/EMP head), and a missing or
            // non-positive ReferenceTaxId (malformed/legacy configuration — DynamicTaxAmountResolver
            // contributes zero for it rather than guessing a tax id), are both dropped instead of
            // fabricating a dependency edge on some other tax.
            var dependencies = taxes.ToDictionary(
                t => t.Id,
                t => config.ConditionRulesFor(t.Id)
                    .Where(r => string.Equals(r.ResultBase, DynamicTaxResultBases.OtherTax, System.StringComparison.OrdinalIgnoreCase) &&
                                r.ReferenceTaxId.HasValue && r.ReferenceTaxId.Value > 0)
                    .Select(r => r.ReferenceTaxId!.Value)
                    .Where(id => id != t.Id && taxIds.Contains(id))
                    .Distinct()
                    .ToList());

            if (dependencies.Values.All(d => d.Count == 0))
            {
                return taxes.ToList();
            }

            var ordered = new List<TaxMasterEntity>(taxes.Count);
            var placed = new HashSet<int>();
            var remaining = taxes.ToList();

            // Kahn-style: repeatedly emit every tax whose dependencies are already placed, keeping
            // input order within each pass so ordering stays stable and predictable.
            while (remaining.Count > 0)
            {
                var ready = remaining
                    .Where(t => dependencies[t.Id].All(placed.Contains))
                    .ToList();

                if (ready.Count == 0)
                {
                    // Every node here has >= 1 outgoing edge still inside `remaining` (otherwise it
                    // would already be ready), which guarantees at least one genuine cycle exists —
                    // find it (there may be more than one, and there will always be nodes outside it
                    // that only depend ON it) rather than assuming the whole set is cyclic.
                    var cycleIds = FindCycleMembers(remaining, dependencies);

                    logger.LogWarning(
                        "Dynamic tax {ResultBase} reference cycle detected among TaxIds=[{TaxIds}]. " +
                        "Force-placing them in TaxMaster order; unresolvable references will contribute zero.",
                        DynamicTaxResultBases.OtherTax, string.Join(", ", cycleIds));

                    var cycleTaxes = remaining.Where(t => cycleIds.Contains(t.Id)).ToList();
                    ordered.AddRange(cycleTaxes);
                    foreach (var id in cycleIds)
                    {
                        placed.Add(id);
                    }
                    remaining.RemoveAll(t => cycleIds.Contains(t.Id));
                    continue;
                }

                ordered.AddRange(ready);
                foreach (var tax in ready)
                {
                    placed.Add(tax.Id);
                    remaining.Remove(tax);
                }
            }

            return ordered;
        }

        /// <summary>
        /// Tarjan's SCC algorithm restricted to <paramref name="nodes"/>, returning the ids of every
        /// node that sits on an actual cycle (an SCC of size &gt; 1 — self-loops are impossible here
        /// since a tax can never depend on itself, see the <c>id != t.Id</c> filter above). A node
        /// whose SCC is itself alone merely depends on something inside a cycle without being part of
        /// one, and must NOT be force-placed — it belongs in a later, normal pass once the cycle it
        /// points at has been placed.
        /// </summary>
        private static HashSet<int> FindCycleMembers(
            List<TaxMasterEntity> nodes,
            Dictionary<int, List<int>> dependencies)
        {
            var nodeIds = nodes.Select(n => n.Id).ToHashSet();
            var index = new Dictionary<int, int>();
            var lowLink = new Dictionary<int, int>();
            var onStack = new HashSet<int>();
            var stack = new Stack<int>();
            var cycleMembers = new HashSet<int>();
            var counter = 0;

            void StrongConnect(int v)
            {
                index[v] = counter;
                lowLink[v] = counter;
                counter++;
                stack.Push(v);
                onStack.Add(v);

                foreach (var w in dependencies[v].Where(nodeIds.Contains))
                {
                    if (!index.ContainsKey(w))
                    {
                        StrongConnect(w);
                        lowLink[v] = System.Math.Min(lowLink[v], lowLink[w]);
                    }
                    else if (onStack.Contains(w))
                    {
                        lowLink[v] = System.Math.Min(lowLink[v], index[w]);
                    }
                }

                if (lowLink[v] == index[v])
                {
                    var component = new List<int>();
                    int w;
                    do
                    {
                        w = stack.Pop();
                        onStack.Remove(w);
                        component.Add(w);
                    } while (w != v);

                    if (component.Count > 1)
                    {
                        foreach (var id in component)
                        {
                            cycleMembers.Add(id);
                        }
                    }
                }
            }

            foreach (var id in nodeIds)
            {
                if (!index.ContainsKey(id))
                {
                    StrongConnect(id);
                }
            }

            return cycleMembers;
        }
    }
}
