using Microsoft.EntityFrameworkCore;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Revision;
using NtisPlatform.Core.Enums.Revision;
using NtisPlatform.Core.Exceptions;
using NtisPlatform.Core.Models.Revision;

namespace NtisPlatform.Infrastructure.Repositories.PropertyRevision;

/// <summary>
/// Snapshot capture: copies the CURRENT live property state (PropertyMast, PropertyMastDetails,
/// PropertyDetails, renters, rooms, social/certificate/photo rows, exempt taxes) and the live RV/CV
/// calculation + policy-tax rows into the Revision* snapshot tables for one revision (and, for
/// PERIOD_WISE, one period). Pure C# port of the former usp_Revision_CaptureSnapshot.
/// </summary>
public partial class RevisionRepository
{
    // Columns that exist in the database but are not mapped on the live entities - read with a
    // tiny raw query so they are still carried into the snapshot.
    private sealed class OwnerSignRemarkRow
    {
        public int Id { get; set; }
        public int? OwnerSignRemarkId { get; set; }
    }

    private sealed class ChangeDetectionYearRow
    {
        public int Id { get; set; }
        public int? ChangeDetectionYear { get; set; }
    }

    private static decimal Round2(decimal value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);

    private static decimal? ToNullableDecimal(double? value) => value.HasValue ? (decimal)value.Value : null;

    private static decimal Round0(decimal value) => Math.Round(value, 0, MidpointRounding.AwayFromZero);

    private static decimal ToDecimal2(double? value) => value.HasValue ? Round2((decimal)value.Value) : 0m;

    private async Task<RevisionCaptureSnapshotResult> CaptureSnapshotCoreAsync(
        RevisionMastEntity mast,
        long? revisionPeriodId,
        int? createdBy,
        string prorationMethod,
        CancellationToken ct)
    {
        var propertyId = mast.PropertyId;
        var revisionMastId = mast.Id;
        var calc = mast.CalculationType;
        var isRv = calc == RevisionCalculationType.RV || calc == RevisionCalculationType.BOTH;
        var isCv = calc == RevisionCalculationType.CV || calc == RevisionCalculationType.BOTH;

        // ---- period / proration -------------------------------------------------------------
        int? periodDays = null;
        int? yearDays = null;
        var prorationFactor = 1.0m;

        if (revisionPeriodId.HasValue)
        {
            var period = await _context.Set<RevisionPeriodEntity>()
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    p => p.Id == revisionPeriodId.Value
                         && p.RevisionMastId == revisionMastId
                         && p.IsActive
                         && !p.MarkedForDeletion,
                    ct)
                ?? throw new RevisionValidationException("RevisionPeriod not found for this revision.");

            periodDays = period.PeriodDays;
            var financeYear = await GetFinanceYearAsync(mast.FinanceYearId, ct);
            var (fyStart, fyEnd) = FinanceYearRange(financeYear);
            yearDays = (fyEnd - fyStart).Days + 1;
            prorationFactor = Math.Round((decimal)periodDays.Value / yearDays.Value, 10);
        }
        else
        {
            prorationMethod = "NO_PRORATION";
        }

        // ---- revision status check & refresh support ----------------------------------------
        if (mast.RevisionStatus is RevisionStatus.APPROVED or RevisionStatus.POSTED or RevisionStatus.CANCELLED)
        {
            throw new RevisionConflictException(
                $"Revision {revisionMastId} is {mast.RevisionStatus} and snapshots cannot be captured or modified.");
        }

        var alreadyCaptured = await _context.Set<RevisionPropertyMastEntity>()
            .AnyAsync(
                r => r.RevisionMastId == revisionMastId
                     && r.RevisionPeriodId == revisionPeriodId
                     && r.IsActive
                     && !r.MarkedForDeletion,
                ct);
        if (alreadyCaptured)
        {
            // Support controlled snapshot refresh during DRAFT/CALCULATED status
            await ClearExistingSnapshotForPeriodAsync(revisionMastId, revisionPeriodId, ct);
        }

        var now = DateTime.Now;

        // ---- PropertyMast -------------------------------------------------------------------
        var live = await _context.Set<PropertyEntity>()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == propertyId && p.IsActive && !p.MarkedForDeletion, ct)
            ?? throw new RevisionValidationException("Active PropertyMast row not found.");

        // OpenPlot is [NotMapped] on the live entity but exists as a column.
        var openPlotRows = await _context.Database
            .SqlQuery<bool?>($"SELECT OpenPlot AS [Value] FROM PTIS.PropertyMast WHERE Id = {propertyId}")
            .ToListAsync(ct);
        var openPlot = openPlotRows.FirstOrDefault();

        var revProperty = new RevisionPropertyMastEntity
        {
            RevisionMastId = revisionMastId,
            RevisionPeriodId = revisionPeriodId,
            SourcePropertyId = live.Id,
            TaxZoneId = live.TaxZoneId,
            WardId = live.WardId,
            PropertyNo = live.PropertyNo,
            PartitionNo = live.PartitionNo,
            PropertySeqNo = live.PropertySeqNo ?? 0,
            PropertyTypeId = live.PropertyTypeId,
            UPICId = live.UPICId,
            OpenPlot = openPlot,
            MoujaId = live.MoujaId,
            CSN = live.CSN,
            SubZoneNo = live.SubZoneNo,
            PlotNo = live.PlotNo,
            CategoryId = live.CategoryId,
            Type = live.Type,
            OwnerTitle = live.OwnerTitle,
            OwnerName = live.OwnerName,
            OccupierTitle = live.OccupierTitle,
            OccupierName = live.OccupierName,
            FlatOrShopNo = live.FlatOrShopNo,
            FlatOrShopName = live.FlatOrShopName,
            Address = live.Address,
            PinCode = live.PinCode,
            Location = live.Location,
            MobileNo = live.MobileNo,
            MobileNoRemarkId = live.MobileNoRemarkId,
            AlternateMobileNo = live.AlternateMobileNo,
            OccupierMobileNo = live.OccupierMobileNo,
            OccupierMobileNoRemarkId = live.OccupierMobileNoRemarkId,
            EmailId = live.EmailId,
            WingDetailId = live.WingDetailId,
            OwnerTitleEnglish = live.OwnerTitleEnglish,
            OwnerNameEnglish = live.OwnerNameEnglish,
            OccupierTitleEnglish = live.OccupierTitleEnglish,
            OccupierNameEnglish = live.OccupierNameEnglish,
            FlatOrShopNoEnglish = live.FlatOrShopNoEnglish,
            FlatOrShopNameEnglish = live.FlatOrShopNameEnglish,
            AddressEnglish = live.AddressEnglish,
            LocationEnglish = live.LocationEnglish,
            PropertyAssessmentStatusId = live.PropertyAssessmentStatusId,
            PropertyFloorId = live.PropertyFloorId,
            CreatedBy = createdBy,
            CreatedDate = now
        };
        _context.Set<RevisionPropertyMastEntity>().Add(revProperty);
        await _context.SaveChangesAsync(ct); // need revProperty.Id for the child tables

        int? wingDetailId = live.WingDetailId;
        int? societyDetailId = null;
        if (wingDetailId.HasValue)
        {
            societyDetailId = await _context.Set<WingDetailsMastEntity>()
                .AsNoTracking()
                .Where(w => w.Id == wingDetailId.Value)
                .Select(w => (int?)w.SocietyDetailsMastId)
                .FirstOrDefaultAsync(ct);
        }

        // ---- PropertyMastDetails ------------------------------------------------------------
        var assessments = await _context.Set<PropertyAssessmentEntity>()
            .AsNoTracking()
            .Include(a => a.BHKMaster)
            .Where(a => a.PropertyId == propertyId && a.IsActive && !a.MarkedForDeletion)
            .ToListAsync(ct);

        var ownerSignRows = await _context.Database
            .SqlQuery<OwnerSignRemarkRow>(
                $"SELECT Id, OwnerSignRemarkId FROM PTIS.PropertyMastDetails WHERE PropertyId = {propertyId}")
            .ToListAsync(ct);
        var ownerSignById = ownerSignRows.ToDictionary(r => r.Id, r => r.OwnerSignRemarkId);

        foreach (var a in assessments)
        {
            _context.Set<RevisionPropertyMastDetailsEntity>().Add(new RevisionPropertyMastDetailsEntity
            {
                RevisionMastId = revisionMastId,
                RevisionPeriodId = revisionPeriodId,
                RevisionPropertyMastId = revProperty.Id,
                SourcePropertyMastDetailsId = a.Id,
                OwnerTypeId = a.OwnerTypeId,
                AssessmentRemark = a.AssessmentRemark,
                SurveyRemark = a.SurveyRemark,
                OwnerSignRemarkId = ownerSignById.TryGetValue(a.Id, out var signId) ? signId : null,
                FlatSystemRemark = a.FlatSystemRemark,
                CombPropRemark = a.CombPropRemark,
                AdharCardNo = a.AdharCardNo,
                RenterMobileNo = a.RenterMobileNo,
                PrarupYadiPublishDate = a.PrarupYadiPublishDate,
                AntimYadiPublishDate = a.AntimYadiPublishDate,
                PropertyRegDate = a.PropertyRegDate,
                ApplyTaxesFrom = a.ApplyTaxesFrom,
                PartOCDate = a.PartOCDate,
                BHK = a.BHKMaster != null ? a.BHKMaster.BHKName : null,
                BlockNo = a.BlockNo,
                AlternetivEmailId = a.AlternativeEmailId,
                TotalBuiltupAreaSqFeet = a.TotalBuiltupAreaSqFeet,
                TotalBuiltupAreaSqMeter = a.TotalBuiltupAreaSqMeter,
                Latitude = a.Latitude,
                Longitude = a.Longitude,
                NoOfResidentialToilets = a.NoOfResidentialToilets,
                NoOfCommercialToilets = a.NoOfCommercialToilets,
                UnitGenerationType = a.UnitGenerationType,
                CreatedBy = createdBy,
                CreatedDate = now
            });
        }

        // ---- PropertyDetails (+ source -> revision id map) ----------------------------------
        var details = await _context.Set<PropertyDetailsEntity>()
            .AsNoTracking()
            .Where(d => d.PropertyId == propertyId && d.IsActive && !d.MarkedForDeletion)
            .ToListAsync(ct);

        var floorSequence = await _context.Set<FloorEntity>()
            .AsNoTracking()
            .ToDictionaryAsync(f => f.Id, f => f.SequenceNo, ct);

        var changeYearRows = await _context.Database
            .SqlQuery<ChangeDetectionYearRow>(
                $"SELECT Id, ChangeDetectionYear FROM PTIS.PropertyDetails WHERE PropertyId = {propertyId}")
            .ToListAsync(ct);
        var changeYearById = changeYearRows.ToDictionary(r => r.Id, r => r.ChangeDetectionYear);

        int FloorOrder(PropertyDetailsEntity d) =>
            d.FloorId.HasValue && floorSequence.TryGetValue(d.FloorId.Value, out var seq) && seq.HasValue
                ? seq.Value
                : 999999;

        var orderedDetails = details.OrderBy(FloorOrder).ThenBy(d => d.Id).ToList();
        var revDetails = new List<(int SourceId, RevisionPropertyDetailsEntity Entity)>();
        var detailSequence = 0;
        foreach (var d in orderedDetails)
        {
            detailSequence++;
            var entity = new RevisionPropertyDetailsEntity
            {
                RevisionMastId = revisionMastId,
                RevisionPeriodId = revisionPeriodId,
                RevisionPropertyMastId = revProperty.Id,
                SourcePropertyDetailsId = d.Id,
                DetailSequenceNo = detailSequence,
                IsTaxable = d.IsTaxable,
                FloorId = d.FloorId ?? 0,
                SubFloorId = d.SubFloorId,
                ConstructionYear = d.ConstructionYear,
                AssessmentYear = d.AssessmentYear,
                ConstructionTypeId = d.ConstructionTypeId ?? 0,
                TypeOfUseId = d.TypeOfUseId,
                SubTypeOfUseId = d.SubTypeOfUseId,
                CarpetAreaSqMeter = d.CarpetAreaSqMeter,
                CarpetAreaSqFeet = d.CarpetAreaSqFeet,
                BuiltupAreaSqMeter = d.BuiltupAreaSqMeter,
                BuiltupAreaSqFeet = d.BuiltupAreaSqFeet,
                NoOfRooms = d.NoOfRooms,
                IsRenter = d.IsRenter,
                ChangeDetectionYear = changeYearById.TryGetValue(d.Id, out var cy) ? cy : null,
                CreatedBy = createdBy,
                CreatedDate = now
            };
            revDetails.Add((d.Id, entity));
            _context.Set<RevisionPropertyDetailsEntity>().Add(entity);
        }

        await _context.SaveChangesAsync(ct); // property details + details master rows

        var detailMap = revDetails.ToDictionary(x => x.SourceId, x => x.Entity.Id);
        var detailKeys = detailMap.Keys.ToList();

        long? RevDetailId(int? sourceId) =>
            sourceId.HasValue && detailMap.TryGetValue(sourceId.Value, out var id) ? id : null;

        // ---- RenterMast ---------------------------------------------------------------------
        var renters = await _context.Set<RenterMastEntity>()
            .AsNoTracking()
            .Where(r => detailKeys.Contains(r.PropertyDetailsId) && r.IsActive && !r.MarkedForDeletion)
            .ToListAsync(ct);
        foreach (var r in renters)
        {
            _context.Set<RevisionRenterMastEntity>().Add(new RevisionRenterMastEntity
            {
                RevisionMastId = revisionMastId,
                RevisionPeriodId = revisionPeriodId,
                RevisionPropertyDetailsId = detailMap[r.PropertyDetailsId],
                SourceRenterMastId = r.Id,
                RentMonthly = r.RentMonthly,
                FinalYearlyRent = r.FinalYearlyRent,
                FinancialYear = r.FinancialYear,
                DurationFrom = r.DurationFrom,
                DurationTo = r.DurationTo,
                TaxLiability = r.TaxLiability,
                NonCalculateRentMonthly = r.NonCalculateRentMonthly,
                RenterNameEnglish = r.RenterNameEnglish,
                RenterName = r.RenterName,
                AgreementDate = r.AgreementDate,
                AgreementFromDate = r.AgreementFromDate,
                AgreementToDate = r.AgreementToDate,
                DocumentBindingId = r.DocumentBindingId,
                CreatedBy = createdBy,
                CreatedDate = now
            });
        }

        // ---- RenterDetails (linked to PropertyDetails, so RevisionRenterMastId stays NULL) ---
        var renterDetails = await _context.Set<RenterDetailEntity>()
            .AsNoTracking()
            .Where(r => detailKeys.Contains(r.PropertyDetailsId) && r.IsActive && !r.MarkedForDeletion)
            .ToListAsync(ct);
        foreach (var r in renterDetails)
        {
            _context.Set<RevisionRenterDetailsEntity>().Add(new RevisionRenterDetailsEntity
            {
                RevisionMastId = revisionMastId,
                RevisionPeriodId = revisionPeriodId,
                RevisionPropertyDetailsId = detailMap[r.PropertyDetailsId],
                RevisionRenterMastId = null,
                SourceRenterDetailsId = r.Id,
                AgreementId = r.AgreementId,
                IncrementFrequency = r.IncrementFrequency,
                IncrementType = r.IncrementType,
                IncrementValue = ToNullableDecimal(r.IncrementValue),
                IncrementMethod = r.IncrementMethod,
                DurationFrom = r.DurationFrom,
                DurationTo = r.DurationTo,
                RentAmount = ToNullableDecimal(r.RentAmount),
                Increment = ToNullableDecimal(r.Increment),
                IncrementStatus = r.IncrementStatus,
                RentMonthly = ToNullableDecimal(r.RentMonthly),
                CustomFromDate = r.CustomFromDate,
                CustomToDate = r.CustomToDate,
                CustomIncrementType = r.CustomIncrementType,
                CustomIncrementValue = ToNullableDecimal(r.CustomIncrementValue),
                CustomMethod = r.CustomMethod,
                CreatedBy = createdBy,
                CreatedDate = now
            });
        }

        // ---- Room-wise submission (+ minus data) --------------------------------------------
        var rooms = await _context.Set<RoomWiseSubmissionDetailsEntity>()
            .AsNoTracking()
            .Where(rw => rw.IsActive
                         && !rw.MarkedForDeletion
                         && (rw.PropertyId == propertyId
                             || (rw.PropertyDetailsId != null && detailKeys.Contains(rw.PropertyDetailsId.Value))))
            .ToListAsync(ct);

        var revRooms = new List<(int SourceId, RevisionRoomWiseSubmissionDetailsEntity Entity)>();
        foreach (var rw in rooms)
        {
            var entity = new RevisionRoomWiseSubmissionDetailsEntity
            {
                RevisionMastId = revisionMastId,
                RevisionPeriodId = revisionPeriodId,
                RevisionPropertyMastId = revProperty.Id,
                RevisionPropertyDetailsId = RevDetailId(rw.PropertyDetailsId),
                SourceRoomWiseSubmissionDetailsId = rw.Id,
                LengthMtr = rw.LengthMtr,
                WidthMtr = rw.WidthMtr,
                AreaSqMtr = rw.AreaSqMtr,
                HeightMtr = rw.HeightMtr,
                Base1Mtr = rw.Base1Mtr,
                Base2Mtr = rw.Base2Mtr,
                NoOfRooms = rw.NoOfRooms,
                TotalAreaSqMtr = rw.TotalAreaSqMtr,
                Shape = rw.Shape,
                RoomNo = rw.RoomNo,
                OuterYesNo = rw.OuterYesNo,
                RoomTypeId = rw.RoomTypeId,
                SubmissionType = rw.SubmissionType,
                MinusYesNo = rw.MinusYesNo,
                CreatedBy = createdBy,
                CreatedDate = now
            };
            revRooms.Add((rw.Id, entity));
            _context.Set<RevisionRoomWiseSubmissionDetailsEntity>().Add(entity);
        }

        // ---- Social / certificates / photos (property + its wing + its society) -------------
        var socials = await _context.Set<PropertySocialDetailsEntity>()
            .AsNoTracking()
            .Where(s => s.IsActive
                        && !s.MarkedForDeletion
                        && ((s.EntityType == "P" && s.PropertyId == propertyId)
                            || (s.EntityType == "W" && wingDetailId.HasValue && s.WingDetailId == wingDetailId)
                            || (s.EntityType == "S" && societyDetailId.HasValue && s.SocietyDetailId == societyDetailId)))
            .ToListAsync(ct);
        foreach (var s in socials)
        {
            _context.Set<RevisionPropertySocialDetailsEntity>().Add(new RevisionPropertySocialDetailsEntity
            {
                RevisionMastId = revisionMastId,
                RevisionPeriodId = revisionPeriodId,
                SourcePropertySocialDetailsId = s.Id,
                EntityType = s.EntityType,
                SocietyDetailId = s.SocietyDetailId,
                WingDetailId = s.WingDetailId,
                PropertyId = s.PropertyId,
                SocialAttributeId = s.SocialAttributeId,
                BitValue = s.BitValue,
                IntValue = s.IntValue,
                DecimalValue = s.DecimalValue,
                TextValue = s.TextValue,
                DateValue = s.DateValue,
                DocumentBindingId = s.DocumentBindingId,
                Remark = s.Remark,
                CreatedBy = createdBy,
                CreatedDate = now
            });
        }

        // MarkedForDeletion on these two entities is a get-only wrapper over a private field,
        // so it is filtered in memory rather than in the SQL.
        var certificates = (await _context.Set<PropertyCertificateEntity>()
                .AsNoTracking()
                .Where(c => c.IsActive
                            && ((c.EntityType == "P" && c.PropertyId == propertyId)
                                || (c.EntityType == "W" && wingDetailId.HasValue && c.WingDetailId == wingDetailId)
                                || (c.EntityType == "S" && societyDetailId.HasValue && c.SocietyDetailId == societyDetailId)))
                .ToListAsync(ct))
            .Where(c => !c.MarkedForDeletion)
            .ToList();
        foreach (var c in certificates)
        {
            _context.Set<RevisionPropertyCertificatesEntity>().Add(new RevisionPropertyCertificatesEntity
            {
                RevisionMastId = revisionMastId,
                RevisionPeriodId = revisionPeriodId,
                RevisionPropertyDetailsId = RevDetailId(c.PropertyDetailsId),
                SourcePropertyCertificateId = c.Id,
                SourcePropertyDetailsId = c.PropertyDetailsId,
                EntityType = c.EntityType,
                SocietyDetailId = c.SocietyDetailId,
                WingDetailId = c.WingDetailId,
                PropertyId = c.PropertyId,
                CertificateTypeId = c.CertificateTypeId,
                CertificateNo = c.CertificateNo,
                CertificateIssueDate = c.IssueDate,
                DocumentBindingId = c.DocumentBindingId,
                TaxApplied = c.TaxApplied,
                TaxAppliedDate = c.TaxAppliedDate,
                CreatedBy = createdBy,
                CreatedDate = now
            });
        }

        // Photos: metadata / document binding only - the binary is not duplicated.
        var photos = (await _context.Set<PropertyPhotoEntity>()
                .AsNoTracking()
                .Where(p => p.IsActive
                            && p.IsLatest
                            && ((p.EntityType == "P" && p.PropertyId == propertyId)
                                || (p.EntityType == "W" && wingDetailId.HasValue && p.WingDetailId == wingDetailId)
                                || (p.EntityType == "S" && societyDetailId.HasValue && p.SocietyDetailId == societyDetailId)))
                .ToListAsync(ct))
            .Where(p => !p.MarkedForDeletion)
            .ToList();
        foreach (var p in photos)
        {
            _context.Set<RevisionPropertyPhotoEntity>().Add(new RevisionPropertyPhotoEntity
            {
                RevisionMastId = revisionMastId,
                RevisionPeriodId = revisionPeriodId,
                SourcePropertyPhotoId = p.Id,
                EntityType = p.EntityType,
                SocietyDetailId = p.SocietyDetailId,
                WingDetailId = p.WingDetailId,
                PropertyId = p.PropertyId,
                Type = p.Type,
                PhotoTypeId = p.PhotoTypeId,
                DocumentBindingId = p.DocumentBindingId,
                IsLatest = p.IsLatest,
                DisplayOrder = p.DisplayOrder,
                Remarks = p.Remarks,
                CreatedBy = createdBy,
                CreatedDate = now
            });
        }

        // ---- ApplyTaxesMaster (exempted taxes used by the RV engine) ------------------------
        var applyTaxes = await _context.Set<ApplyTaxesMasterEntity>()
            .AsNoTracking()
            .Where(a => a.PropertyId == propertyId && a.IsActive && !a.MarkedForDeletion)
            .ToListAsync(ct);
        foreach (var a in applyTaxes)
        {
            _context.Set<RevisionApplyTaxesMasterEntity>().Add(new RevisionApplyTaxesMasterEntity
            {
                RevisionMastId = revisionMastId,
                RevisionPeriodId = revisionPeriodId,
                PropertyId = propertyId,
                SourceApplyTaxesMasterId = a.Id,
                TaxId = a.TaxId,
                CreatedBy = createdBy,
                CreatedDate = now
            });
        }

        await _context.SaveChangesAsync(ct); // renters, rooms, social, certs, photos, apply-taxes

        var roomMap = revRooms.ToDictionary(x => x.SourceId, x => x.Entity.Id);
        if (roomMap.Count > 0)
        {
            var roomKeys = roomMap.Keys.ToList();
            var minusRows = await _context.Set<RoomWiseMinusDataEntity>()
                .AsNoTracking()
                .Where(m => roomKeys.Contains(m.RoomWiseSubmissionId) && m.IsActive && !m.MarkedForDeletion)
                .ToListAsync(ct);
            foreach (var m in minusRows)
            {
                _context.Set<RevisionRoomWiseMinusDataEntity>().Add(new RevisionRoomWiseMinusDataEntity
                {
                    RevisionMastId = revisionMastId,
                    RevisionPeriodId = revisionPeriodId,
                    RevisionRoomWiseSubmissionId = roomMap[m.RoomWiseSubmissionId],
                    SourceRoomWiseMinusDataId = m.Id,
                    LengthMtr = m.LengthMtr,
                    WidthMtr = m.WidthMtr,
                    AreaSqMtr = m.AreaSqMtr,
                    HeightMtr = m.HeightMtr,
                    Base1Mtr = m.Base1Mtr,
                    Base2Mtr = m.Base2Mtr,
                    Shape = m.Shape,
                    IsOffset = m.IsOffset,
                    CreatedBy = createdBy,
                    CreatedDate = now
                });
            }
        }

        var periodProration = revisionPeriodId.HasValue;

        // ---- RV results + tax details + policy tax ------------------------------------------
        if (isRv)
        {
            var rvRows = await _context.Set<RVCalculationResultsEntity>()
                .AsNoTracking()
                .Where(r => r.PropertyId == propertyId
                            && detailKeys.Contains(r.PropertyDetailsId)
                            && r.IsActive
                            && !r.MarkedForDeletion)
                .ToListAsync(ct);

            var revRvRows = new List<(int SourceId, RevisionRVCalculationResultsEntity Entity)>();
            foreach (var rv in rvRows)
            {
                var entity = new RevisionRVCalculationResultsEntity
                {
                    RevisionMastId = revisionMastId,
                    RevisionPeriodId = revisionPeriodId,
                    PropertyId = propertyId,
                    RevisionPropertyDetailsId = detailMap[rv.PropertyDetailsId],
                    SourceRVCalculationResultsId = rv.Id,
                    MonthlyRate = rv.MonthlyRate,
                    YearlyRate = rv.YearlyRate,
                    YearlyRent = rv.YearlyRent,
                    AppliedOn = rv.AppliedOn,
                    Depreciation = rv.Depreciation,
                    DepreciationPer = rv.DepreciationPer,
                    AnnualRentalValue = rv.AnnualRentalValue,
                    Maintenance = rv.Maintenance,
                    RateableValue = rv.RateableValue,
                    REducationTax = rv.REducationTax,
                    CEducationTax = rv.CEducationTax,
                    CEmploymentTax = rv.CEmploymentTax,
                    TotalAreaSqMtr = rv.TotalAreaSqMtr,
                    RAreaSqMtr = rv.RAreaSqMtr,
                    CAreaSqlMtr = rv.CAreaSqlMtr,
                    ProrationFactor = periodProration ? prorationFactor : null,
                    PeriodAnnualRentalValue = periodProration
                        ? Round2(ToDecimal2(rv.AnnualRentalValue) * prorationFactor)
                        : null,
                    PeriodRateableValue = periodProration
                        ? Round2(Round2(rv.RateableValue ?? 0m) * prorationFactor)
                        : null,
                    CreatedBy = createdBy,
                    CreatedDate = now
                };
                revRvRows.Add((rv.Id, entity));
                _context.Set<RevisionRVCalculationResultsEntity>().Add(entity);
            }

            await _context.SaveChangesAsync(ct); // need revision RV result ids

            var rvMap = revRvRows.ToDictionary(x => x.SourceId, x => x.Entity.Id);
            if (rvMap.Count > 0)
            {
                var rvKeys = rvMap.Keys.ToList();
                var taxRows = await _context.Set<RVCalculationTaxDetailsEntity>()
                    .AsNoTracking()
                    .Where(t => rvKeys.Contains(t.RVCalculationResultsId) && t.IsActive && !t.MarkedForDeletion)
                    .ToListAsync(ct);
                foreach (var t in taxRows)
                {
                    _context.Set<RevisionRVCalculationTaxDetailsEntity>().Add(new RevisionRVCalculationTaxDetailsEntity
                    {
                        RevisionMastId = revisionMastId,
                        RevisionPeriodId = revisionPeriodId,
                        RevisionRVCalculationResultsId = rvMap[t.RVCalculationResultsId],
                        SourceRVCalculationTaxDetailsId = t.Id,
                        TaxId = t.TaxId,
                        TaxPercentage = t.TaxPercentage,
                        TaxAmount = t.TaxAmount,
                        ProrationMethod = periodProration ? prorationMethod : "NO_PRORATION",
                        PeriodDays = periodDays,
                        YearDays = yearDays,
                        ProrationFactor = periodProration ? prorationFactor : 1.0m,
                        PeriodTaxAmount = periodProration
                            ? Round2(Round2(t.TaxAmount ?? 0m) * prorationFactor)
                            : Round2(t.TaxAmount ?? 0m),
                        CreatedBy = createdBy,
                        CreatedDate = now
                    });
                }
            }

            // Final property-level RV policy tax. TaxAmount is the period amount for PERIOD_WISE
            // and the annual amount otherwise.
            var rvTransMast = await _context.Set<TransMastEntity>()
                .AsNoTracking()
                .Where(t => t.PropertyId == propertyId
                            && t.FinanceYearId == mast.FinanceYearId
                            && t.CalculationType == "RV"
                            && t.IsActive
                            && !t.MarkedForDeletion)
                .ToListAsync(ct);
            var annualValueByPolicyTax = rvTransMast
                .GroupBy(t => (t.PolicyCodeId, t.TaxId))
                .ToDictionary(g => g.Key, g => g.OrderByDescending(t => t.Id).First().CalculationAnnualValue);

            var policyTax = await _context.Set<PolicyTaxDetailsEntity>()
                .AsNoTracking()
                .Where(p => p.PropertyId == propertyId && p.IsCurrent && p.IsActive && !p.MarkedForDeletion)
                .ToListAsync(ct);
            foreach (var p in policyTax)
            {
                _context.Set<RevisionPolicyTaxDetailsEntity>().Add(new RevisionPolicyTaxDetailsEntity
                {
                    RevisionMastId = revisionMastId,
                    RevisionPeriodId = revisionPeriodId,
                    PropertyId = propertyId,
                    SourcePolicyTaxDetailsId = p.Id,
                    PolicyCodeId = p.PolicyCodeId,
                    AnnualCalculationValue = annualValueByPolicyTax.TryGetValue((p.PolicyCodeId, p.TaxId), out var annual)
                        ? annual
                        : null,
                    CalculationValue = p.CalculationValue,
                    TaxId = p.TaxId,
                    AnnualTaxAmount = p.TaxAmount,
                    TaxAmount = periodProration ? Round0((p.TaxAmount ?? 0m) * prorationFactor) : p.TaxAmount,
                    IsCurrent = true,
                    CreatedBy = createdBy,
                    CreatedDate = now
                });
            }
        }

        // ---- CV results + policy tax --------------------------------------------------------
        if (isCv)
        {
            var cvRows = await _context.Set<PropertyTaxCalculationCVResultsEntity>()
                .AsNoTracking()
                .Where(c => c.PropertyId == propertyId
                            && detailKeys.Contains(c.PropertyDetailsId)
                            && c.IsActive
                            && c.MarkedForDeletion != true)
                .ToListAsync(ct);
            foreach (var cv in cvRows)
            {
                _context.Set<RevisionPropertyTaxCalculationCVResultsEntity>().Add(
                    new RevisionPropertyTaxCalculationCVResultsEntity
                    {
                        RevisionMastId = revisionMastId,
                        RevisionPeriodId = revisionPeriodId,
                        RevisionPropertyDetailsId = detailMap[cv.PropertyDetailsId],
                        PropertyId = propertyId,
                        SourcePropertyTaxCalculationCVResultsId = cv.Id,
                        RateCVMasterId = cv.RateCVMasterId ?? 0,
                        TaxId = cv.TaxId,
                        BaseValue = cv.BaseValue,
                        FloorFactorCVId = cv.FloorFactorCVId,
                        AgeFactorCVId = cv.AgeFactorCVId,
                        NatureFactorCVId = cv.NatureFactorCVId,
                        UseFactorCVId = cv.UseFactorCVId,
                        CapitalValue = cv.CapitalValue,
                        TaxPercentage = cv.TaxPercentage,
                        TaxAmount = cv.TaxAmount,
                        CVInputHash = cv.CVInputHash,
                        ProrationMethod = periodProration ? prorationMethod : "NO_PRORATION",
                        PeriodDays = periodDays,
                        YearDays = yearDays,
                        ProrationFactor = periodProration ? prorationFactor : 1.0m,
                        PeriodCapitalValue = periodProration
                            ? Round2(Round2(cv.CapitalValue ?? 0m) * prorationFactor)
                            : null,
                        PeriodTaxAmount = periodProration
                            ? Round2(Round2(cv.TaxAmount ?? 0m) * prorationFactor)
                            : Round2(cv.TaxAmount ?? 0m),
                        CreatedBy = createdBy,
                        CreatedDate = now
                    });
            }

            var policyTaxCv = await _context.Set<PolicyTaxDetailsCVEntity>()
                .AsNoTracking()
                .Where(p => p.PropertyId == propertyId && p.IsCurrent && p.IsActive && !p.MarkedForDeletion)
                .ToListAsync(ct);
            foreach (var p in policyTaxCv)
            {
                _context.Set<RevisionPolicyTaxDetailsCVEntity>().Add(new RevisionPolicyTaxDetailsCVEntity
                {
                    RevisionMastId = revisionMastId,
                    RevisionPeriodId = revisionPeriodId,
                    PropertyId = propertyId,
                    SourcePolicyTaxDetailsCVId = p.Id,
                    PolicyCodeId = p.PolicyCodeId,
                    AnnualCalculationValue = null,
                    CalculationValue = p.CalculationValue,
                    TaxId = p.TaxId,
                    AnnualTaxAmount = p.TaxAmount,
                    TaxAmount = periodProration ? Round0((p.TaxAmount ?? 0m) * prorationFactor) : p.TaxAmount,
                    IsCurrent = true,
                    CreatedBy = createdBy,
                    CreatedDate = now
                });
            }
        }

        // ---- TransMast (demand rows) snapshot -> PTIS.RevisionTransMast ----------------------
        // A straight copy of the live ACTIVE TransMast rows for this property + finance year
        // (all policies, incl. certificate / retro rows), for the calculation type(s) of the revision.
        var transTypes = new List<string>();
        if (isRv) transTypes.Add("RV");
        if (isCv) transTypes.Add("CV");

        var liveTransMast = await _context.Set<TransMastEntity>()
            .AsNoTracking()
            .Where(t => t.PropertyId == propertyId
                        && t.FinanceYearId == mast.FinanceYearId
                        && transTypes.Contains(t.CalculationType)
                        && t.IsActive
                        && !t.MarkedForDeletion)
            .ToListAsync(ct);
        foreach (var t in liveTransMast)
        {
            _context.Set<RevisionTransMastEntity>().Add(new RevisionTransMastEntity
            {
                RevisionMastId = revisionMastId,
                RevisionPeriodId = revisionPeriodId,
                SourceTransMastId = t.Id,
                PropertyId = propertyId,
                FinanceYearId = mast.FinanceYearId,
                CalculationType = t.CalculationType,
                PolicyCodeId = t.PolicyCodeId,
                TaxId = t.TaxId,
                CalculationAnnualValue = t.CalculationAnnualValue.HasValue ? Round2(t.CalculationAnnualValue.Value) : null,
                CalculationValue = Round2(t.CalculationValue),
                TaxAmount = Round2(t.TaxAmount),
                CreatedBy = createdBy,
                CreatedDate = now
            });
        }

        await _context.SaveChangesAsync(ct);

        return new RevisionCaptureSnapshotResult
        {
            RevisionMastId = revisionMastId,
            RevisionPeriodId = revisionPeriodId,
            PropertyId = propertyId,
            CalculationScope = mast.CalculationScope.ToString(),
            CalculationType = mast.CalculationType.ToString(),
            PeriodDays = periodDays,
            YearDays = yearDays,
            ProrationFactor = prorationFactor
        };
    }

    private async Task ClearExistingSnapshotForPeriodAsync(
        long revisionMastId,
        long? revisionPeriodId,
        CancellationToken ct)
    {
        // 1. Calculations & Taxes
        var transMast = await _context.Set<RevisionTransMastEntity>()
            .Where(x => x.RevisionMastId == revisionMastId && x.RevisionPeriodId == revisionPeriodId).ToListAsync(ct);
        if (transMast.Count > 0) _context.Set<RevisionTransMastEntity>().RemoveRange(transMast);

        var policyTaxesCV = await _context.Set<RevisionPolicyTaxDetailsCVEntity>()
            .Where(x => x.RevisionMastId == revisionMastId && x.RevisionPeriodId == revisionPeriodId).ToListAsync(ct);
        if (policyTaxesCV.Count > 0) _context.Set<RevisionPolicyTaxDetailsCVEntity>().RemoveRange(policyTaxesCV);

        var cvResults = await _context.Set<RevisionPropertyTaxCalculationCVResultsEntity>()
            .Where(x => x.RevisionMastId == revisionMastId && x.RevisionPeriodId == revisionPeriodId).ToListAsync(ct);
        if (cvResults.Count > 0) _context.Set<RevisionPropertyTaxCalculationCVResultsEntity>().RemoveRange(cvResults);

        var policyTaxes = await _context.Set<RevisionPolicyTaxDetailsEntity>()
            .Where(x => x.RevisionMastId == revisionMastId && x.RevisionPeriodId == revisionPeriodId).ToListAsync(ct);
        if (policyTaxes.Count > 0) _context.Set<RevisionPolicyTaxDetailsEntity>().RemoveRange(policyTaxes);

        var rvTax = await _context.Set<RevisionRVCalculationTaxDetailsEntity>()
            .Where(x => x.RevisionMastId == revisionMastId && x.RevisionPeriodId == revisionPeriodId).ToListAsync(ct);
        if (rvTax.Count > 0) _context.Set<RevisionRVCalculationTaxDetailsEntity>().RemoveRange(rvTax);

        var rvResults = await _context.Set<RevisionRVCalculationResultsEntity>()
            .Where(x => x.RevisionMastId == revisionMastId && x.RevisionPeriodId == revisionPeriodId).ToListAsync(ct);
        if (rvResults.Count > 0) _context.Set<RevisionRVCalculationResultsEntity>().RemoveRange(rvResults);

        var applyTaxes = await _context.Set<RevisionApplyTaxesMasterEntity>()
            .Where(x => x.RevisionMastId == revisionMastId && x.RevisionPeriodId == revisionPeriodId).ToListAsync(ct);
        if (applyTaxes.Count > 0) _context.Set<RevisionApplyTaxesMasterEntity>().RemoveRange(applyTaxes);

        // 2. Documents, Photos, Certificates, Social
        var docs = await _context.Set<RevisionDocumentDetailsEntity>()
            .Where(x => x.RevisionMastId == revisionMastId && x.RevisionPeriodId == revisionPeriodId).ToListAsync(ct);
        if (docs.Count > 0) _context.Set<RevisionDocumentDetailsEntity>().RemoveRange(docs);

        var photos = await _context.Set<RevisionPropertyPhotoEntity>()
            .Where(x => x.RevisionMastId == revisionMastId && x.RevisionPeriodId == revisionPeriodId).ToListAsync(ct);
        if (photos.Count > 0) _context.Set<RevisionPropertyPhotoEntity>().RemoveRange(photos);

        var certs = await _context.Set<RevisionPropertyCertificatesEntity>()
            .Where(x => x.RevisionMastId == revisionMastId && x.RevisionPeriodId == revisionPeriodId).ToListAsync(ct);
        if (certs.Count > 0) _context.Set<RevisionPropertyCertificatesEntity>().RemoveRange(certs);

        var social = await _context.Set<RevisionPropertySocialDetailsEntity>()
            .Where(x => x.RevisionMastId == revisionMastId && x.RevisionPeriodId == revisionPeriodId).ToListAsync(ct);
        if (social.Count > 0) _context.Set<RevisionPropertySocialDetailsEntity>().RemoveRange(social);

        // 3. Rooms & Minus
        var minus = await _context.Set<RevisionRoomWiseMinusDataEntity>()
            .Where(x => x.RevisionMastId == revisionMastId && x.RevisionPeriodId == revisionPeriodId).ToListAsync(ct);
        if (minus.Count > 0) _context.Set<RevisionRoomWiseMinusDataEntity>().RemoveRange(minus);

        var rooms = await _context.Set<RevisionRoomWiseSubmissionDetailsEntity>()
            .Where(x => x.RevisionMastId == revisionMastId && x.RevisionPeriodId == revisionPeriodId).ToListAsync(ct);
        if (rooms.Count > 0) _context.Set<RevisionRoomWiseSubmissionDetailsEntity>().RemoveRange(rooms);

        // 4. Renters
        var renters = await _context.Set<RevisionRenterMastEntity>()
            .Where(x => x.RevisionMastId == revisionMastId && x.RevisionPeriodId == revisionPeriodId).ToListAsync(ct);
        if (renters.Count > 0) _context.Set<RevisionRenterMastEntity>().RemoveRange(renters);

        var renterDetails = await _context.Set<RevisionRenterDetailsEntity>()
            .Where(x => x.RevisionMastId == revisionMastId && x.RevisionPeriodId == revisionPeriodId).ToListAsync(ct);
        if (renterDetails.Count > 0) _context.Set<RevisionRenterDetailsEntity>().RemoveRange(renterDetails);

        // 5. Floors
        var floors = await _context.Set<RevisionPropertyDetailsEntity>()
            .Where(x => x.RevisionMastId == revisionMastId && x.RevisionPeriodId == revisionPeriodId).ToListAsync(ct);
        if (floors.Count > 0) _context.Set<RevisionPropertyDetailsEntity>().RemoveRange(floors);

        // 6. Property Mast Details
        var mastDetails = await _context.Set<RevisionPropertyMastDetailsEntity>()
            .Where(x => x.RevisionMastId == revisionMastId && x.RevisionPeriodId == revisionPeriodId).ToListAsync(ct);
        if (mastDetails.Count > 0) _context.Set<RevisionPropertyMastDetailsEntity>().RemoveRange(mastDetails);

        // 7. Property Mast
        var propMasts = await _context.Set<RevisionPropertyMastEntity>()
            .Where(x => x.RevisionMastId == revisionMastId && x.RevisionPeriodId == revisionPeriodId).ToListAsync(ct);
        if (propMasts.Count > 0) _context.Set<RevisionPropertyMastEntity>().RemoveRange(propMasts);

        await _context.SaveChangesAsync(ct);
    }
}
