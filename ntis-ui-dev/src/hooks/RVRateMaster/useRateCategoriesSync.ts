import { useState, useEffect } from "react";
import { logger } from "@/lib/utils/logger";
import { toast } from "sonner";
import { getRateMasterByFilters, getOpenPlotTypeOfUseDetailsAction, getTypeOfUseDetailsAction } from "@/app/[locale]/property-tax/rate-master/rvratemaster/action";
import { useConfirm } from "@/components/common/ConfirmProvider";
import type { RateCategory, ITypeOfUseDetails } from "@/types/RVRateMaster";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface RateCategoriesSyncProps {
  rateCategories: RateCategory[];
  isOpenPlot: boolean;
  selectedZone: string;
  assessmentYear: string;
  t: ReturnType<typeof import("next-intl").useTranslations>;
}

export function useRateCategoriesSync({
  rateCategories,
  isOpenPlot,
  selectedZone,
  assessmentYear,
  t,
}: RateCategoriesSyncProps) {
  const rateSection = useAliasLabel("Rate_Section", useAliasLabel("Rate Section", t("aliasFallback.rateSection")));
  const assessment = useAliasLabel("Assessment", t("aliasFallback.assessment"));
  const use = useAliasLabel("Use", t("aliasFallback.use"));
  const typeOfUse = useAliasLabel("Type_Of_Use", useAliasLabel("Type of Use", t("aliasFallback.typeOfUse")));
  const category = useAliasLabel("Category", t("aliasFallback.category"));
  const [hasConfiguredRates, setHasConfiguredRates] = useState(false);
  const [isConfigureRatesOpen, setIsConfigureRatesOpen] = useState(false);
  const [localRateCategories, setLocalRateCategories] = useState<RateCategory[]>(rateCategories);
  const { confirm } = useConfirm();

  const fetchLatestRateCategories = async () => {
    try {
      const detailsResult = isOpenPlot
        ? await getOpenPlotTypeOfUseDetailsAction()
        : await getTypeOfUseDetailsAction(1, -1);
      const details = detailsResult.items || [];
      const opCategory = details.find(t => t.typeOfUseCode === 'OP');

      const categoriesList: RateCategory[] = [];
      const seenGroupIds = new Set<number>();

      const getAssociatedTypes = (groupId?: number) => {
        if (!isOpenPlot || !groupId) return undefined;
        return details
          .filter(t => t.typeOfUseGroupId === groupId)
          .map(t => ({
            code: t.typeOfUseCode || "",
            description: t.description || ""
          }));
      };

      if (opCategory) {
        categoriesList.push({
          constructionId: String(opCategory.id),
          constructionCode: opCategory.typeOfUseCode || String(opCategory.id),
          description: opCategory.description || "",
          typeOfUseGroupId: opCategory.typeOfUseGroupId,
          typeOfUseGroupCode: opCategory.typeOfUseGroupCode,
          groupName: opCategory.groupName,
          associatedUseTypes: getAssociatedTypes(opCategory.typeOfUseGroupId)
        });
        if (opCategory.typeOfUseGroupId) {
          seenGroupIds.add(opCategory.typeOfUseGroupId);
        }
      }

      // Always process OpenSpace types to ensure they are included in the categories list
      if (isOpenPlot) {
        const openSpaceTypes = details.filter(t => t.typeOfUseCategoryCode === 'OpenPlot');
        openSpaceTypes.forEach(tu => {
          const groupId = tu.typeOfUseGroupId;
          if (groupId && groupId > 0) {
            if (!seenGroupIds.has(groupId)) {
              seenGroupIds.add(groupId);
              categoriesList.push({
                constructionId: String(tu.id),
                constructionCode: tu.typeOfUseCode || String(tu.id),
                description: tu.description || "",
                typeOfUseGroupId: groupId,
                typeOfUseGroupCode: tu.typeOfUseGroupCode,
                groupName: tu.groupName,
                associatedUseTypes: getAssociatedTypes(groupId)
              });
            }
          }
        });
      }

      details.forEach(tu => {
        if (tu.typeOfUseCode === 'OP') return;
        if (tu.typeOfUseCategoryCode === 'OpenPlot') return; // already processed

        const groupId = tu.typeOfUseGroupId;
        if (groupId && groupId > 0) {
          if (!seenGroupIds.has(groupId)) {
            seenGroupIds.add(groupId);
            categoriesList.push({
              constructionId: String(tu.id),
              constructionCode: tu.typeOfUseCode || String(tu.id),
              description: tu.description || "",
              typeOfUseGroupId: groupId,
              typeOfUseGroupCode: tu.typeOfUseGroupCode,
              groupName: tu.groupName,
              associatedUseTypes: getAssociatedTypes(groupId)
            });
          }
        }
      });

      setLocalRateCategories(categoriesList);
    } catch (err) {
      logger.error("Failed to load latest rate categories", { error: err as Error });
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalRateCategories(rateCategories);
  }, [rateCategories]);

  const handleConfigureSelected = async (selectedTypes: ITypeOfUseDetails[]) => {
    setIsConfigureRatesOpen(false);

    // Clear URL parameters
    const params = new URLSearchParams(window.location.search);
    params.delete("configureRates");
    params.delete("checkedUseTypes");
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);

    try {
      const detailsResult = isOpenPlot
        ? await getOpenPlotTypeOfUseDetailsAction()
        : await getTypeOfUseDetailsAction(1, -1);
      const details = detailsResult.items || [];
      const opCategory = details.find(t => t.typeOfUseCode === 'OP');

      const categoriesList: RateCategory[] = [];
      const seenGroupIds = new Set<number>();

      if (isOpenPlot) {
        const existingRates = await getRateMasterByFilters(selectedZone, "ALL", assessmentYear);
        const existingGroupIds = new Set<number>();
        if (existingRates && existingRates.length > 0) {
          existingRates.forEach(rate => {
            if (rate.typeOfUseGroupId) {
              existingGroupIds.add(rate.typeOfUseGroupId);
            }
          });
        }

        const toAddCategories: RateCategory[] = [];
        const alreadyConfiguredCodes: string[] = [];

        const getAssociatedTypes = (groupId?: number) => {
          if (!groupId) return undefined;
          return details
            .filter(t => t.typeOfUseGroupId === groupId)
            .map(t => ({
              code: t.typeOfUseCode || "",
              description: t.description || ""
            }));
        };

        const processType = (tu: ITypeOfUseDetails) => {
          const groupId = tu.typeOfUseGroupId;
          const code = tu.typeOfUseCode || String(tu.id);
          const exists = groupId && existingGroupIds.has(groupId);

          if (exists) {
            if (!alreadyConfiguredCodes.includes(code)) {
              alreadyConfiguredCodes.push(code);
            }
          } else {
            if (groupId && groupId > 0) {
              if (!seenGroupIds.has(groupId)) {
                seenGroupIds.add(groupId);
                toAddCategories.push({
                  constructionId: String(tu.id),
                  constructionCode: code,
                  description: tu.description || "",
                  typeOfUseGroupId: groupId,
                  typeOfUseGroupCode: tu.typeOfUseGroupCode,
                  groupName: tu.groupName,
                  associatedUseTypes: getAssociatedTypes(groupId)
                });
              }
            } else {
              toAddCategories.push({
                constructionId: String(tu.id),
                constructionCode: code,
                description: tu.description || "",
                typeOfUseGroupId: groupId,
                typeOfUseGroupCode: tu.typeOfUseGroupCode,
                groupName: tu.groupName,
                associatedUseTypes: getAssociatedTypes(groupId)
              });
            }
          }
        };

        if (opCategory) processType(opCategory);

        // Always include OpenPlot types
        const openSpaceTypes = details.filter(t => t.typeOfUseCategoryCode === 'OpenPlot');
        openSpaceTypes.forEach(t => processType(t));

        selectedTypes.forEach(tu => {
          if (tu.typeOfUseCode === 'OP') return;
          if (tu.typeOfUseCategoryCode === 'OpenPlot') return; // already processed
          processType(tu);
        });

        if (toAddCategories.length > 0) {
          setLocalRateCategories(toAddCategories);
          if (alreadyConfiguredCodes.length > 0) {
            const codesStr = `'${alreadyConfiguredCodes.join(", ")}'`;
            toast.success(t('messages.validationRatesAlreadyExistSome', { codes: codesStr, use }) || `Rates already exist for ${codesStr}. Only unconfigured use types are shown.`);
          }
        } else {
          const allCategories: RateCategory[] = [];
          const seenAll = new Set<number>();

          const processAllType = (tu: ITypeOfUseDetails) => {
            const groupId = tu.typeOfUseGroupId;
            const code = tu.typeOfUseCode || String(tu.id);
            if (groupId && groupId > 0) {
              if (!seenAll.has(groupId)) {
                seenAll.add(groupId);
                allCategories.push({
                  constructionId: String(tu.id),
                  constructionCode: code,
                  description: tu.description || "",
                  typeOfUseGroupId: groupId,
                  typeOfUseGroupCode: tu.typeOfUseGroupCode,
                  groupName: tu.groupName,
                  associatedUseTypes: getAssociatedTypes(groupId)
                });
              }
            } else {
              allCategories.push({
                constructionId: String(tu.id),
                constructionCode: code,
                description: tu.description || "",
                typeOfUseGroupId: groupId,
                typeOfUseGroupCode: tu.typeOfUseGroupCode,
                groupName: tu.groupName,
                associatedUseTypes: getAssociatedTypes(groupId)
              });
            }
          };

          if (opCategory) processAllType(opCategory);
          openSpaceTypes.forEach(t => processAllType(t));
          selectedTypes.forEach(tu => {
            if (tu.typeOfUseCode === 'OP') return;
            if (tu.typeOfUseCategoryCode === 'OpenPlot') return; // already processed
            processAllType(tu);
          });

          setLocalRateCategories(allCategories);
          toast.error(t('messages.validationRatesAlreadyExist'));
        }
      } else {
        if (opCategory) {
          categoriesList.push({
            constructionId: String(opCategory.id),
            constructionCode: opCategory.typeOfUseCode || String(opCategory.id),
            description: opCategory.description || "",
            typeOfUseGroupId: opCategory.typeOfUseGroupId,
            typeOfUseGroupCode: opCategory.typeOfUseGroupCode,
            groupName: opCategory.groupName
          });
          if (opCategory.typeOfUseGroupId) {
            seenGroupIds.add(opCategory.typeOfUseGroupId);
          }
        }

        selectedTypes.forEach(tu => {
          if (tu.typeOfUseCode === 'OP') return;

          const groupId = tu.typeOfUseGroupId;
          if (groupId && groupId > 0) {
            if (!seenGroupIds.has(groupId)) {
              seenGroupIds.add(groupId);
              categoriesList.push({
                constructionId: String(tu.id),
                constructionCode: tu.typeOfUseCode || String(tu.id),
                description: tu.description || "",
                typeOfUseGroupId: groupId,
                typeOfUseGroupCode: tu.typeOfUseGroupCode,
                groupName: tu.groupName
              });
            }
          } else {
            categoriesList.push({
              constructionId: String(tu.id),
              constructionCode: tu.typeOfUseCode || String(tu.id),
              description: tu.description || "",
              typeOfUseGroupId: groupId,
              typeOfUseGroupCode: tu.typeOfUseGroupCode,
              groupName: tu.groupName
            });
          }
        });

        setLocalRateCategories(categoriesList);
      }

      setHasConfiguredRates(true);
    } catch (_err) {
      toast.error(t('configureRates.toast.saveError'));
    }
  };

  const handleConfigureRatesClick = async () => {
    if (!selectedZone || selectedZone === "ALL" || !assessmentYear || assessmentYear === "ALL") {
      toast.error(t('messages.selectRateSection', { rateSection, assessment }));
      return;
    }
    try {
      const detailsResult = isOpenPlot
        ? await getOpenPlotTypeOfUseDetailsAction()
        : await getTypeOfUseDetailsAction(1, -1);
      const details = detailsResult.items || [];

      confirm({
        title: t('dialogs.configureUseTypeTitle', { typeOfUse, use }),
        description: t('dialogs.configureUseTypeDescription', { typeOfUse, use, category }),
        confirmText: t('dialogs.confirmYes'),
        cancelText: t('dialogs.confirmNo'),
        onConfirm: () => {
          setIsConfigureRatesOpen(true);
          const params = new URLSearchParams(window.location.search);
          params.set("configureRates", "true");
          window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
        },
        onCancel: () => {
          setHasConfiguredRates(true);
          if (isOpenPlot) {
            const opTypes = details.filter(t => t.typeOfUseCategoryCode === 'OpenPlot');
            
            // Sort 'OP' to the front so it takes priority for duplicate group IDs
            opTypes.sort((a, b) => {
              if (a.typeOfUseCode === 'OP') return -1;
              if (b.typeOfUseCode === 'OP') return 1;
              return 0;
            });

            const distinctGroupIds = new Set<number>();
            const opCategories = opTypes
              .filter(tu => {
                const groupId = tu.typeOfUseGroupId;
                if (groupId && !distinctGroupIds.has(groupId)) {
                  distinctGroupIds.add(groupId);
                  return true;
                }
                return false;
              })
              .map(tu => {
                const associated = opTypes
                  .filter(item => item.typeOfUseGroupId === tu.typeOfUseGroupId)
                  .map(item => ({
                    code: item.typeOfUseCode || "",
                    description: item.description || ""
                  }));
                return {
                  constructionId: String(tu.id),
                  constructionCode: tu.typeOfUseCode || String(tu.id),
                  description: tu.description || "",
                  typeOfUseGroupId: tu.typeOfUseGroupId,
                  typeOfUseGroupCode: tu.typeOfUseGroupCode,
                  groupName: tu.groupName,
                  associatedUseTypes: associated
                };
              });
            setLocalRateCategories(opCategories);
          } else {
            const opCategory = details.find(t => t.typeOfUseCode === 'OP');
            if (opCategory) {
              const opCategories = [{
                constructionId: String(opCategory.id),
                constructionCode: opCategory.typeOfUseCode || String(opCategory.id),
                description: opCategory.description || "",
                typeOfUseGroupId: opCategory.typeOfUseGroupId,
                typeOfUseGroupCode: opCategory.typeOfUseGroupCode,
                groupName: opCategory.groupName,
              }];
              setLocalRateCategories(opCategories);
            }
          }
        }
      });
    } catch (_err) {
      toast.error(t('configureRates.toast.loadTypesOfUseFailed', { typeOfUse }));
    }
  };

  const handleConfigureDrawerClose = async (savedAny: boolean) => {
    setIsConfigureRatesOpen(false);
    const params = new URLSearchParams(window.location.search);
    params.delete("configureRates");
    params.delete("checkedUseTypes");
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
    if (savedAny) {
      setHasConfiguredRates(true);
      await fetchLatestRateCategories();
    }
  };

  return {
    hasConfiguredRates,
    setHasConfiguredRates,
    isConfigureRatesOpen,
    setIsConfigureRatesOpen,
    localRateCategories,
    setLocalRateCategories,
    fetchLatestRateCategories,
    handleConfigureSelected,
    handleConfigureRatesClick,
    handleConfigureDrawerClose,
  };
}
