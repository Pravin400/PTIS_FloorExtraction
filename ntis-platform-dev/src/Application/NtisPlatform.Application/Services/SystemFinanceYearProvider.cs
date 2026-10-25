using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using System;
using System.Linq;

namespace NtisPlatform.Application.Services
{
    public class SystemFinanceYearProvider : IFinanceYearProvider
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public SystemFinanceYearProvider(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        // Reads CORE.YearMaster.IsActive = 1 instead of calendar math,
        // Falls back to the original April-fiscal-year calendar calculation if no row is flagged active.
        public int GetCurrentFinanceYear()
        {
            using var scope = _scopeFactory.CreateScope();
            var yearMasterRepo = scope.ServiceProvider.GetRequiredService<IRepository<YearMasterEntity, int>>();

            var activeYear = yearMasterRepo.GetQueryable()
                .Where(y => y.IsActive)
                .Select(y => (int?)y.Year)
                .FirstOrDefault();

            if (activeYear.HasValue)
                return activeYear.Value;

            var today = DateTime.Today;
            return today.Month >= 4 ? today.Year : today.Year - 1;
        }
    }
}
