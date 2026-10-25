INSERT PTIS.ZoneMaster([ZoneNo], [Description],[DescriptionEnglish],[CreatedBy],[UpdatedBy],[UpdatedDate])
VALUES
 (N'UT', N'उथळसर',N'Uthalsar',NULL, NULL, NULL),
 (N'NK', N'नौपाडा - कोपरी', N'Naupada - Kopri', NULL, NULL, NULL),
 (N'KL', N'कळवा',N'Kalwa',NULL, NULL, NULL),
 (N'MU', N'मुंब्रा',N'Mumbra',NULL, NULL, NULL),
 (N'DI', N'दिवा', N'Diva',NULL, NULL, NULL),
 (N'WE', N'वागळे इस्टेट',N'Wagle Estate',NULL, NULL, NULL),
 (N'LS', N'लोकमान्य सावरकर',N'Lokmanya Savarkar',NULL, NULL, NULL),
 (N'VN', N'वर्तकनगर',N'Vartak Nagar',NULL, NULL, NULL),
 (N'MM', N'माजिवडा मानपाडा',N'Majiwada Manpada',NULL, NULL, NULL);



;WITH WardSeed (ZoneNo, WardNo) AS
(
    SELECT * FROM (VALUES
      (N'DI', N'DI1'),
      (N'DI', N'DI2'),
      (N'DI', N'DI3'),
      (N'DI', N'DI4'),
      (N'DI', N'DI5'),
      (N'DI', N'DI6'),
      (N'DI', N'DI7'),
      (N'DI', N'DI8'),
      (N'DI', N'DI9'),
      (N'DI', N'DI10'),
      (N'DI', N'DI11'),
      (N'DI', N'DI12'),
      (N'DI', N'DI13'),
      (N'DI', N'DI14'),
      (N'DI', N'DIMAJOR1'),
      (N'DI', N'DIMAJOR2'),
      (N'KL', N'KL1'),
      (N'KL', N'KL2'),
      (N'KL', N'KL3'),
      (N'KL', N'KL4'),
      (N'KL', N'KL5'),
      (N'KL', N'KL6'),
      (N'KL', N'KL7'),
      (N'KL', N'KL8'),
      (N'KL', N'KL9'),
      (N'KL', N'KL10'),
      (N'KL', N'KL11'),
      (N'KL', N'KL12'),
      (N'KL', N'KL13'),
      (N'KL', N'KL14'),
      (N'KL', N'KLMAJOR1'),
      (N'KL', N'KLMAJOR2'),
      (N'KL', N'KLMAJOR3'),
      (N'LS', N'LS1'),
      (N'LS', N'LS2'),
      (N'LS', N'LS3'),
      (N'LS', N'LS4'),
      (N'LS', N'LS5'),
      (N'LS', N'LS6'),
      (N'LS', N'LS7'),
      (N'LS', N'LS8'),
      (N'LS', N'LS9'),
      (N'LS', N'LS10'),
      (N'LS', N'LS11'),
      (N'LS', N'LS12'),
      (N'LS', N'LS13'),
      (N'LS', N'LS14'),
      (N'LS', N'LSMAJOR1'),
      (N'MM', N'MM1'),
      (N'MM', N'MM2'),
      (N'MM', N'MM3'),
      (N'MM', N'MM4'),
      (N'MM', N'MM5'),
      (N'MM', N'MM6'),
      (N'MM', N'MM7'),
      (N'MM', N'MM8'),
      (N'MM', N'MM9'),
      (N'MM', N'MM10'),
      (N'MM', N'MM11'),
      (N'MM', N'MM12'),
      (N'MM', N'MM13'),
      (N'MM', N'MM14'),
      (N'MM', N'MM15'),
      (N'MM', N'MM16'),
      (N'MM', N'MM17'),
      (N'MM', N'MM18'),
      (N'MM', N'MM19'),
      (N'MM', N'MM20'),
      (N'MM', N'MMMAJOR'),
      (N'MM', N'MMMAJOR2'),
      (N'MM', N'MMMAJOR3'),
      (N'MM', N'MMMAJOR4'),
      (N'MM', N'MMMAJOR5'),
      (N'MU', N'MU1'),
      (N'MU', N'MU2'),
      (N'MU', N'MU3'),
      (N'MU', N'MU4'),
      (N'MU', N'MU5'),
      (N'MU', N'MU6'),
      (N'MU', N'MU7'),
      (N'MU', N'MU8'),
      (N'MU', N'MU9'),
      (N'MU', N'MU10'),
      (N'MU', N'MU11'),
      (N'MU', N'MU12'),
      (N'MU', N'MU13'),
      (N'MU', N'MU14'),
      (N'MU', N'MU15'),
      (N'MU', N'MU16'),
      (N'MU', N'MU17'),
      (N'MU', N'MU18'),
      (N'MU', N'MU19'),
      (N'MU', N'MU20'),
      (N'MU', N'MU21'),
      (N'MU', N'MU22'),
      (N'MU', N'MUMAJOR1'),
      (N'MU', N'MUMAJOR2'),
      (N'MU', N'MUMAJOR3'),
      (N'MU', N'MUMAJOR4'),
      (N'NK', N'NK1'),
      (N'UT', N'UT1'),
      (N'VN', N'VN1'),
      (N'WE', N'WE1')
    ) v(ZoneNo, WardNo)
)
INSERT PTIS.WardMaster (ZoneId, WardNo, [Description])
SELECT z.Id,
       w.WardNo,
       w.WardNo  
FROM WardSeed w
JOIN PTIS.ZoneMaster z
  ON z.ZoneNo = w.ZoneNo;


SET IDENTITY_INSERT [PTIS].[TypeOfUseGroupMaster] ON;
GO

INSERT INTO PTIS.TypeOfUseGroupMaster
(Id, TypeOfUseGroupCode, GroupName, GroupIcon, IsProtected, IsOpenPlotGroup)
VALUES
(1, N'R',  N'निवासी',     N'home', 1,0),
(2, N'C',  N'व्यावसायिक', N'home', 1,0),
(3, N'I',  N'औद्योगिक',   N'home', 1,0),
(4, N'N',  N'इतर',        N'home', 1,0),
(5, N'OP', N'खुला भूखंड',       N'home', 1,1),
(6, N'OPC', N'खुला भूखंड अनिवासी',       N'home', 1,1),
(7, N'OPI', N'खुला भूखंड औद्योगिक',       N'home', 1,1),
(8, N'OPF', N'खुला भूखंड शेती',       N'home', 1,1),
(9, N'OPN', N'खुला भूखंड करमुक्त',       N'home', 1,1);
GO

SET IDENTITY_INSERT [PTIS].[TypeOfUseGroupMaster] OFF;
GO


SET IDENTITY_INSERT [PTIS].[TypeOfUseGroupMasterCV] ON;
GO

INSERT INTO PTIS.TypeOfUseGroupMasterCV
(Id, TypeOfUseGroupCVCode, GroupName, GroupIcon, IsFloorWiseRateApplicable, IsProtected, CreatedBy, UpdatedBy, UpdatedDate)
VALUES
(1, N'R',  N'निवासी CV',     N'home', 0, 1, NULL, NULL, NULL),
(2, N'C',  N'व्यावसायिक CV', N'home', 1, 1, NULL, NULL, NULL),
(3, N'I',  N'औद्योगिक CV',   N'home', 0, 1, NULL, NULL, NULL),
(4, N'N',  N'इतर CV',        N'home', 0, 1, NULL, NULL, NULL),
(5, N'OP', N'प्लॉट CV',       N'home', 0, 1, NULL, NULL, NULL);
GO

SET IDENTITY_INSERT [PTIS].[TypeOfUseGroupMasterCV] OFF;
GO





INSERT INTO [PTIS].[PropertyAssessmentStatusMaster] (StatusName)
SELECT s.StatusName
FROM (VALUES
    ('ASSESSED'),
    ('UNASSESSED'),
    ('PARTIALLY_ASSESSED'),
    ('UNDER_UNASSESSED')
) s(StatusName)
WHERE NOT EXISTS (
    SELECT 1
    FROM [PTIS].[PropertyAssessmentStatusMaster] p
    WHERE p.StatusName = s.StatusName
);

MERGE [PTIS].[AssessmentYearRangeMasterRV] AS T
USING
(
    VALUES
        (2016, 2026),
        (2005, 2015),
        (2003, 2004),
        (1998, 1998),
        (1700, 1997),
        -- 1999-2002 was missing: the rate seed below carries 204 rows for it, which the range join
        -- dropped, and a property assessed in those years got "Year Not Found" (0 tax). Listed last so the
        -- Ids of the ranges above stay 1-5.
        (1999, 2002)
) AS S (FromYear, ToYear)

ON T.FromYear = S.FromYear

WHEN MATCHED
    AND T.ToYear <> S.ToYear
THEN
    UPDATE SET T.ToYear = S.ToYear

WHEN NOT MATCHED THEN
    INSERT (FromYear, ToYear)
    VALUES (S.FromYear, S.ToYear);



MERGE [PTIS].[AssessmentYearRangeMasterCV] AS T
USING
(
    VALUES
        (2016, 2026),
        (2005, 2015),
        (2003, 2004),
        (1998, 1998),
        (1700, 1997)
) AS S (FromYear, ToYear)

ON T.FromYear = S.FromYear

WHEN MATCHED
    AND T.ToYear <> S.ToYear
THEN
    UPDATE SET T.ToYear = S.ToYear

WHEN NOT MATCHED THEN
    INSERT (FromYear, ToYear)
    VALUES (S.FromYear, S.ToYear);







SET IDENTITY_INSERT [PTIS].[TypeOfUseCategoryMaster] ON;
GO

INSERT INTO [PTIS].[TypeOfUseCategoryMaster]
(
    [Id],
    [TypeOfUseCategoryCode],
    [TypeOfUseCategoryName],
    [IsProtected]
)
VALUES
(1, 'Utility',  N'UTILITY', 1),
(2, 'Parking',  N'PARKING', 1),
(3, 'OpenSpace', N'Open Space', 1),
(4, 'OpenPlot', N'Open Plot',      1);
GO
SET IDENTITY_INSERT [PTIS].[TypeOfUseCategoryMaster] OFF;
GO




SET IDENTITY_INSERT [PTIS].[TypeOfUseMaster] ON;
GO

;WITH GroupMap AS
(
    SELECT
        g.Id AS TypeOfUseGroupId,
        g.TypeOfUseGroupCode
    FROM PTIS.TypeOfUseGroupMaster g
),
GroupMapCV AS
(
    SELECT
        gcv.Id AS TypeOfUseGroupCVId,
        gcv.TypeOfUseGroupCVCode
    FROM PTIS.TypeOfUseGroupMasterCV gcv
),
TypeSeed AS
(
    SELECT * FROM (VALUES

(N'R', N'निवासी', N'Residential', N'R', N'R', 1, NULL, NULL, N'R', 1, 1, NULL),
(N'C', N'अनिवासी', N'Non-Residential', N'C', N'C', 1, NULL, NULL, N'C', 1, 0, NULL),
(N'I', N'कारखाना', N'Industrial', N'I', N'I', 1, NULL, NULL, N'I', 1, 0, NULL),
(N'T', N'धार्मिक स्थळ', N'Religious Place', N'N', N'N', 1, NULL, NULL, N'T', 1, 1, NULL),
(N'V', N'V-व्हरांडा टॉयल॓ट बाथ', N'Veranda Toilet Bath', N'N', N'N', 1, NULL, NULL, N'V', 1, 0, NULL),
(N'S', N'दुकान', N'Shop', N'C', N'C', 1, NULL, NULL, N'S', 1, 0, NULL),
(N'D', N'दवाखाना', N'Clinic', N'C', N'C', 1, NULL, NULL, N'D', 1, 0, NULL),
(N'B', N'बँक', N'Bank', N'C', N'C', 1, NULL, NULL, N'B', 1, 0, NULL),
(N'SW', N'जलतरण तलाव', N'Swimming Pool', N'C', N'C', 1, NULL, NULL, N'S', 4, 0, NULL),

(N'UC', N'बांधकाम चालू ', N'Under Construction', N'N', N'N', 1, NULL, NULL, N'U', 1, 0, NULL),
(N'SPK', N'स्टील पार्किंग ', N'Steel Parking', N'R', N'R', 1, NULL, NULL, N'S', 5, 1, 1),
(N'N', N'मनपा मालमत्ता', N'Municipal Corporation Property', N'N', N'N', 1, NULL, NULL, N'N', 1, 1, NULL),
(N'EG', N'शैक्षणिक शासकीय ', N'Government Educational', N'C', N'C', 1, NULL, NULL, N'E', 3, 0, NULL),
(N'GO', N'गोडाऊन', N'Godown', N'C', N'C', 1, NULL, NULL, N'G', 3, 0, NULL),
(N'GR', N'शासकीय निवासी', N'Government Residential', N'R', N'R', 1, NULL, NULL, N'G', 4, 0, NULL),
(N'HO', N'खाजगी वसतिगृह', N'Private Hostel', N'R', N'R', 1, NULL, NULL, N'H', 4, 0, NULL),
(N'LB', N'वाचनालय/लायब्ररी ', N'Library', N'C', N'C', 1, NULL, NULL, N'L', 2, 1, NULL),
(N'UCC', N'बांधकाम चालु-अनिवासी ', N'Under Construction - Non-Residential', N'N', N'N', 1, NULL, NULL, N'U', 1, 0, NULL),
(N'MTR', N'टॉवर जागा', N'Tower Space', N'C', N'C', 1, NULL, NULL, N'W', 9, 0, NULL),
(N'FF', N'स्वातंत्र्य सैनिक', N'Freedom Fighter', N'R', N'R', 1, NULL, NULL, N'F', 1, 0, NULL),
(N'WGC', N'WGC-व्हरांडा  शासकीय अनिवासी', N'Veranda Government Non-Residential', N'C', N'C', 1, NULL, NULL, N'G', 2, 0, NULL),
(N'WEG', N'WEG-व्हरांडा शैक्षणीक शासकीय', N'Veranda Government Educational', N'C', N'C', 1, NULL, NULL, N'E', 4, 0, NULL),
(N'WEP', N'WEP-व्हरांडा खाजगी शैक्षणीक ', N'Veranda Private Educational', N'C', N'C', 1, NULL, NULL, N'E', 2, 0, NULL),
(N'WGR', N'WGR-व्हरांडा शासकीय निवासी', N'Veranda Government Residential', N'R', N'R', 1, NULL, NULL, N'G', 4, 0, NULL),
(N'PC', N'पार्किंग अनिवासी', N'Parking Non-Residential', N'N', N'N', 1, NULL, NULL, N'P', NULL, 0, 1),

(N'EP', N'खाजगी शैक्षणिक', N'Private Educational', N'C', N'C', 1, NULL, NULL, N'E', 1, 0, NULL),
(N'WR', N'WR-व्हरांडा निवासी', N'Veranda Residential', N'R', N'R', 1, NULL, NULL, N'R', 2, 0, NULL),
(N'WC', N'WC-व्हरांडा अनिवासी', N'Veranda Non-Residential', N'C', N'C', 1, NULL, NULL, N'S', 2, 0, NULL),
(N'CC', N'कोचिंग क्लासेस', N'Coaching Classes', N'C', N'C', 1, NULL, NULL, N'C', 2, 0, NULL),
(N'CG', N'केंद्र शासकीय मालमत्ता', N'Central Government Property', N'C', N'C', 1, NULL, NULL, N'C', NULL, 0, NULL),
(N'CR', N'केंद्र शासकीय मालमत्ता निवासी', N'Central Government Residential Property', N'R', N'R', 1, NULL, NULL, N'R', NULL, 0, NULL),
(N'PTR', N'पेट्रोल पंप', N'Petrol Pump', N'C', N'C', 1, NULL, NULL, N'P', 1, 0, NULL),
(N'GC', N'शासकीय अनिवासी', N'Government Non-Residential', N'C', N'C', 1, NULL, NULL, N'C', NULL, 0, NULL),
(N'O', N'ऑफिस', N'Office', N'C', N'C', 1, NULL, NULL, N'O', 1, 0, NULL),
(N'M', N'मंगल कार्यालय', N'Marriage Hall', N'C', N'C', 1, NULL, NULL, N'M', 1, 0, NULL),
(N'KT', N'मल्टीप्लेक्स', N'Multiplex', N'C', N'C', 1, NULL, NULL, N'T', 2, 0, NULL),
(N'H', N'हॉटेल', N'Hotel', N'C', N'C', 1, NULL, NULL, N'H', 1, 0, NULL),
(N'OPK', N'ओपन पार्किंग', N'Open Parking', N'R', N'R', 1, NULL, NULL, N'R', NULL, 1, 1),
(N'WI', N'WI-व्हरांडा औद्योगिक', N'Veranda Industrial', N'I', N'I', 1, NULL, NULL, N'I', 2, 0, NULL),

(N'WCGR', N'WCGR-केंद्र शासकीय मालमत्ता', N'Central Government Residential Property', N'R', N'R', 1, NULL, NULL, N'R', NULL, 0, NULL),
(N'WCGC', N'WCGC-केंद्र शासकीय मालमत्ता', N'Central Government Non-Residential Property', N'C', N'C', 1, NULL, NULL, N'C', NULL, 0, NULL),
(N'CH', N'सामाजिक सभागृह', N'Community Hall', N'C', N'C', 1, NULL, NULL, N'C', NULL, 0, NULL),
(N'L', N'लॉज', N'Lodge', N'C', N'C', 1, NULL, NULL, N'C', NULL, 0, NULL),
(N'AG', N'शेती', N'Agriculture', N'N', N'N', 1, NULL, NULL, N'N', NULL, 1, NULL),
(N'ACH', N'क्लब हाऊस ', N'Club House', N'C', N'C', 1, NULL, NULL, N'C', NULL, 1, NULL),
(N'AGM', N'सोसायटी जिम', N'Society Gym', N'C', N'C', 1, NULL, NULL, N'C', NULL, 1, NULL),
(N'AH', N'कॉमन हॉल', N'Common Hall', N'C', N'C', 1, NULL, NULL, N'C', NULL, 1, NULL),
(N'AMH', N'मल्टीपर्पज हॉल', N'Multipurpose Hall', N'C', N'C', 1, NULL, NULL, N'C', NULL, 1, NULL),
(N'AO', N'सोसायटी ऑफीस ', N'Society Office', N'C', N'C', 1, NULL, NULL, N'C', NULL, 1, NULL),
(N'APG', N'खेळाचे मैदान', N'Playground', N'N', N'N', 1, NULL, NULL, N'N', NULL, 1, NULL),
(N'ASW', N'सोसायटी स्विमिंग पूल', N'Society Swimming Pool', N'N', N'N', 1, NULL, NULL, N'N', NULL, 1, NULL),
(N'AWC', N'वॉचमन कॅबिन', N'Watchman Cabin', N'N', N'N', 1, NULL, NULL, N'N', NULL, 1, NULL),
(N'CCO', N'C-कॉरिडॉर', N'Commercial Corridor', N'N', N'N', 1, NULL, NULL, N'N', NULL, 1, NULL),
(N'CCR', N'CCR-ट्युशन क्लासेस ', N'Tuition Classes', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, NULL),
(N'CGC', N'केंद्र शासन वाणिज्य मालमत्ता', N'Central Government Commercial Property', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, NULL),
(N'GM', N'व्यायाम शाळा ', N'Gymnasium', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, NULL),
(N'GMR', N'GMR-व्यायाम शाळा', N'Gymnasium', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, NULL),
(N'KTR', N'KTR-टॉकीज/चित्रपट गृह', N'Cinema / Theatre', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, NULL),
(N'NPD', N'न.प.दुकान गाळे', N'Municipal Shop Units', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, NULL),
(N'OBR', N'OBR', N'OBR', N'N', N'N', 1, NULL, NULL, N'N', NULL, NULL, NULL),
(N'OPKC', N'ओपन पार्किंग अनिवासी', N'Open Parking Non-Residential', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, 1),
(N'RCO', N'R-कॉरिडॉर', N'Residential Corridor', N'N', N'N', 1, NULL, NULL, N'N', NULL, 1, NULL),
(N'RGN', N'जनरेटर रूम/मिटर रूम', N'Generator Room / Meter Room', N'N', N'N', 1, NULL, NULL, N'N', NULL, 1, NULL),
(N'SPKC', N'स्टील पार्किंग अनिवासी', N'Steel Parking Non-Residential', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, 1),
(N'WT', N'R-टॉवर', N'Residential Tower', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, NULL),
(N'PG', N'पेयिंग गेस्ट', N'Paying Guest', N'R', N'R', 1, NULL, NULL, N'R', NULL, NULL, NULL),
(N'GA', N'गार्डन', N'Garden', N'N', N'N', 1, NULL, NULL, N'N', NULL, 1, NULL),
(N'RFG', N'रिफ्युज एरिया', N'Refuge Area', N'N', N'N', 1, NULL, NULL, N'N', NULL, 1, NULL),
(N'PH', N'पंप हाऊस रूम', N'Pump House Room', N'N', N'N', 1, NULL, NULL, N'N', NULL, 1, NULL),
(N'SR', N' स्टोअर रूम', N'Store Room', N'R', N'R', 1, NULL, NULL, N'R', NULL, 1, NULL),
(N'WAT', N' वॉटर टॅंक', N'Water Tank', N'N', N'N', 1, NULL, NULL, N'N', NULL, 1, NULL),
(N'ISR', N'इनडोअर स्पोर्ट रूम ', N'Indoor Sports Room', N'N', N'N', 1, NULL, NULL, N'N', NULL, 1, NULL),
(N'EHO', N'शैक्षणिक संस्था-वसतिगृह', N'Educational Institution - Hostel', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, NULL),
(N'PF', N'पोल्ट्रीफार्म', N'Poultry Farm', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, NULL),
(N'NR', N'सर्व्हेक्षण निवासी', N'Survey Residential', N'R', N'R', 1, NULL, NULL, N'R', NULL, NULL, NULL),
(N'NC', N'सर्व्हेक्षण अनिवासी', N'Survey Non-Residential', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, NULL),
(N'NI', N'सर्व्हेक्षण औद्योगिक', N'Survey Industrial', N'I', N'I', 1, NULL, NULL, N'I', NULL, NULL, NULL),
(N'ICR', N'अनधिकृत बांधकाम निवासी', N'Unauthorized Construction Residential', N'R', N'R', 1, NULL, NULL, N'R', NULL, NULL, NULL),
(N'ICC', N'अनधिकृत बांधकाम अनिवासी ', N'Unauthorized Construction Non-Residential', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, NULL),
(N'ICI', N'अनधिकृत बांधकाम औद्योगिक', N'Unauthorized Construction Industrial', N'I', N'I', 1, NULL, NULL, N'I', NULL, NULL, NULL),
(N'ICRT', N'निवासी शास्तीस पात्र अनधिकृत बांधकाम ', N'Unauthorized Residential Construction - Penalty Applicable', N'R', N'R', 1, NULL, NULL, N'R', NULL, NULL, NULL),
(N'ICCT', N'अनिवासी शास्तीस पात्र अनधिकृत बांधकाम ', N'Unauthorized Non-Residential Construction - Penalty Applicable', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, NULL),
(N'ICIT', N'औद्योगिक शास्तीस पात्र अनधिकृत बांधकाम ', N'Unauthorized Industrial Construction - Penalty Applicable', N'I', N'I', 1, NULL, NULL, N'I', NULL, NULL, NULL),
(N'ICHT', N'हॉटेल शास्तीस पात्र अनधिकृत बांधकाम', N'Unauthorized Hotel Construction - Penalty Applicable', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, NULL),
(N'ICH', N'हॉटेल अनधिकृत बांधकाम', N'Unauthorized Hotel Construction', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, NULL),
(N'ICP', N'अनधिकृत बांधकाम निवासी पार्किंग', N'Unauthorized Residential Parking Construction', N'R', N'R', 1, NULL, NULL, N'R', NULL, NULL, 1),
(N'ICPRT', N'निवासी पार्किंग शास्तीस पात्र अनधिकृत बांधकाम', N'Unauthorized Residential Parking - Penalty Applicable', N'R', N'R', 1, NULL, NULL, N'R', NULL, NULL, 1),
(N'OAH', N'वृद्धाश्रम', N'Old Age Home', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, NULL),
(N'ABLC', N'टेरेस-बाल्कनी अनिवासी', N'Terrace-Balcony Non-Residential', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, NULL),
(N'ABLOP', N'ओपन टेरेस', N'Open Terrace', N'R', N'R', 1, NULL, NULL, N'R', NULL, NULL, NULL),
(N'ABLR', N'टेरेस-बाल्कनी ', N'Terrace-Balcony Residential', N'R', N'R', 1, NULL, NULL, N'R', NULL, NULL, NULL),
(N'ACHC', N'क्लब हाऊस C', N'Club House Commercial', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, NULL),
(N'ASWC', N'सोसायटी स्विमिंग पूल C', N'Society Swimming Pool Commercial', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, NULL),
(N'AWA', N'वेटिंग एरिया', N'Waiting Area', N'R', N'R', 1, NULL, NULL, N'R', NULL, 1, NULL),
(N'FCR', N'फायर कंट्रोल रूम', N'Fire Control Room', N'R', N'R', 1, NULL, NULL, N'R', NULL, NULL, NULL),
(N'FIRR', N'फायर रूम', N'Fire Room', N'R', N'R', 1, NULL, NULL, N'R', NULL, 1, NULL),
(N'GRR', N'गारबेज रूम', N'Garbage Room', N'R', N'R', 1, NULL, NULL, N'R', NULL, 1, NULL),
(N'IT', N'माहिती व तंत्रज्ञान उद्योग', N'Information Technology Industry', N'I', N'I', 1, NULL, NULL, N'I', NULL, NULL, NULL),
(N'LR', N'लिफ्ट रूम', N'Lift Room', N'R', N'R', 1, NULL, NULL, N'R', NULL, 1, NULL),
(N'MR', N'Mail रूम', N'Mail Room', N'R', N'R', 1, NULL, NULL, N'R', NULL, 1, NULL),
(N'OL', N'ओपनिंग लॉबी', N'Opening Lobby', N'R', N'R', 1, NULL, NULL, N'R', NULL, NULL, NULL),
(N'OWC', N'सेंद्रिय कचरा कन्व्हर्टर रूम', N'Organic Waste Converter Room', N'R', N'R', 1, NULL, NULL, N'R', NULL, NULL, NULL),
(N'SI', N'सामाजिक संस्था', N'Social Institution', N'R', N'R', 1, NULL, NULL, N'R', NULL, NULL, NULL),
(N'TL', N'टेरेस लिफ्ट', N'Terrace Lift', N'R', N'R', 1, NULL, NULL, N'R', NULL, NULL, NULL),
(N'OPKI', N'ओपन पार्किंग औदयोगिक', N'Open Parking Industrial', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, 1),
(N'SPKI', N'स्टील पार्किंग औदयोगिक', N'Steel Parking Industrial', N'C', N'C', 1, NULL, NULL, N'C', NULL, NULL, 1),
(N'OP', N'खुला भूखंड', N'Open Plot', N'R', N'OP', 1, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), N'OP', 0, 0, NULL),
(N'OPC', N'खुला भूखंड अनिवासी', N'Open Plot Non-Residential', N'C', N'OPC', 1, NULL, NULL, N'OP', NULL, 0, NULL),
(N'OPI', N'खुला भूखंड औद्योगिक', N'Open Plot Industrial', N'I', N'OPI', 1, NULL, NULL, N'OP', NULL, NULL, NULL),
(N'OPF', N'खुला भूखंड शेती', N'Open Plot Agriculture', N'N', N'OPF', 1, NULL, NULL, N'OP', NULL, NULL, NULL),
(N'OPN', N'करमुक्त', N'Tax Exempt', N'N', N'OPN', 1, NULL, NULL, N'OP', NULL, NULL, NULL)

    ) v
    (
        TypeOfUseCode,
        [Description],
        [DescriptionEnglish],
        [Type],
        TypeOfUseGroupCode,
        CreatedBy,
        UpdatedBy,
        UpdatedDate,
        TypeOfUseGroupCVCode,
        SearchSequence,
        IsSociety,
        TypeOfUseCategoryId
    )
),
TypeOfUseIdMap AS
(
    SELECT * FROM (VALUES
        (N'R', 1),
        (N'C', 2),
        (N'I', 3),
        (N'T', 4),
        (N'V', 5),
        (N'S', 6),
        (N'D', 7),
        (N'B', 8),
        (N'SW', 9),
        (N'UC', 10),
        (N'SPK', 11),
        (N'N', 12),
        (N'EG', 13),
        (N'GO', 14),
        (N'GR', 15),
        (N'HO', 16),
        (N'LB', 17),
        (N'UCC', 18),
        (N'MTR', 19),
        (N'FF', 20),
        (N'WGC', 21),
        (N'WEG', 22),
        (N'WEP', 23),
        (N'WGR', 24),
        (N'PC', 25),
        (N'EP', 26),
        (N'WR', 27),
        (N'WC', 28),
        (N'CC', 29),
        (N'CG', 30),
        (N'CR', 31),
        (N'PTR', 32),
        (N'GC', 33),
        (N'O', 34),
        (N'M', 35),
        (N'KT', 36),
        (N'H', 37),
        (N'OPK', 38),
        (N'WI', 39),
        (N'WCGR', 40),
        (N'WCGC', 41),
        (N'CH', 42),
        (N'L', 43),
        (N'AG', 44),
        (N'ACH', 45),
        (N'AGM', 46),
        (N'AH', 47),
        (N'AMH', 48),
        (N'AO', 49),
        (N'OP', 50),
        (N'OPC', 51),
        (N'OPI', 52),
        (N'OPF', 53),
        (N'OPN', 54),
        (N'CGC', 55),
        (N'GM', 56),
        (N'GMR', 57),
        (N'KTR', 58),
        (N'NPD', 59),
        (N'OBR', 60),
        (N'OPKC', 61),
        (N'RCO', 62),
        (N'RGN', 63),
        (N'SPKC', 64),
        (N'WT', 65),
        (N'PG', 66),
        (N'GA', 67),
        (N'RFG', 68),
        (N'PH', 69),
        (N'SR', 70),
        (N'WAT', 71),
        (N'ISR', 72),
        (N'EHO', 73),
        (N'PF', 74),
        (N'NR', 75),
        (N'NC', 76),
        (N'NI', 77),
        (N'ICR', 78),
        (N'ICC', 79),
        (N'ICI', 80),
        (N'ICRT', 81),
        (N'ICCT', 82),
        (N'ICIT', 83),
        (N'ICHT', 84),
        (N'ICH', 85),
        (N'ICP', 86),
        (N'ICPRT', 87),
        (N'OAH', 88),
        (N'ABLC', 89),
        (N'ABLOP', 90),
        (N'ABLR', 91),
        (N'ACHC', 92),
        (N'ASWC', 93),
        (N'AWA', 94),
        (N'FCR', 95),
        (N'FIRR', 96),
        (N'GRR', 97),
        (N'IT', 98),
        (N'LR', 99),
        (N'MR', 100),
        (N'OL', 101),
        (N'OWC', 102),
        (N'SI', 103),
        (N'TL', 104),
        (N'OPKI', 105),
        (N'SPKI', 106),
        (N'APG', 107),
        (N'ASW', 108),
        (N'AWC', 109),
        (N'CCO', 110),
        (N'CCR', 111)
    ) v(TypeOfUseCode, Id)
)


INSERT INTO PTIS.TypeOfUseMaster
(
    Id,
    TypeOfUseCode,
    [Description],
    [DescriptionEnglish],
    [Type],
    TypeOfUseGroupId,
    TypeOfUseGroupCVId,
    CreatedBy,
    UpdatedBy,
    UpdatedDate,
    SearchSequence,
    TypeOfUseCategoryId,
    IsProtected
)
SELECT
    m.Id,
    s.TypeOfUseCode,
    s.[Description],
    s.[DescriptionEnglish],
    s.[Type],
    gm.TypeOfUseGroupId,
    gcv.TypeOfUseGroupCVId,
    s.CreatedBy,
    s.UpdatedBy,
    s.UpdatedDate,
    ISNULL(s.SearchSequence, m.Id) AS SearchSequence,
    CASE
        WHEN s.TypeOfUseCode IN
        (
            N'WR',
            N'WCGR',
            N'ENCEG',
            N'WGC',
            N'WEG',
            N'WEP',
            N'WC',
            N'WCGC'
        ) THEN 1

        WHEN s.TypeOfUseCode IN
        (
            N'OPK',
            N'ICPRT',
            N'OPKC',
            N'SPKC',
            N'OPKI',
            N'SPKI',
            N'PC'
        ) THEN 2

        WHEN s.TypeOfUseCode IN
        (
            N'ABLOP',
            N'GA',
            N'RFG'
        ) THEN 3

        WHEN s.TypeOfUseCode IN
        (
            N'OP',
            N'OPC',
            N'OPI',
            N'OPF',
            N'OPN'
        ) THEN 4

        ELSE s.TypeOfUseCategoryId
    END AS TypeOfUseCategoryId,
    1 AS IsProtected

FROM TypeSeed s

JOIN TypeOfUseIdMap m
    ON m.TypeOfUseCode = s.TypeOfUseCode

JOIN GroupMap gm
    ON gm.TypeOfUseGroupCode = s.TypeOfUseGroupCode

JOIN GroupMapCV gcv
    ON gcv.TypeOfUseGroupCVCode = s.TypeOfUseGroupCVCode;


UPDATE tou
SET tou.TypeOfUseGroupCVId = gcv.Id
FROM PTIS.TypeOfUseMaster tou
JOIN PTIS.TypeOfUseGroupMaster g
    ON g.Id = tou.TypeOfUseGroupId
JOIN PTIS.TypeOfUseGroupMasterCV gcv
    ON gcv.TypeOfUseGroupCVCode =
        CASE
            WHEN g.TypeOfUseGroupCode IN
            (
                N'OP',
                N'OPC',
                N'OPI',
                N'OPF',
                N'OPN'
            )
            THEN N'OP'
            ELSE g.TypeOfUseGroupCode
        END;

GO

SET IDENTITY_INSERT [PTIS].[TypeOfUseMaster] OFF;
GO


SET IDENTITY_INSERT [PTIS].[ConstructionTypeMaster] ON;

INSERT INTO [PTIS].[ConstructionTypeMaster]([Id],[ConstructionCode],[Description],[DescriptionEnglish],[SearchSequence],[IsProtected])
VALUES
(1, N'A',  N'सिमेंट कॉक्रिट संरचना',N'Cement Concrete Structure',1, 0),
(2, N'B',  N'सिमेंट/चुना/दगड/विटांची भिंत व स्लॅब',N'Cement/Lime/Stone/Brick Wall with Slab',    2, 0),
(3, N'C',  N'सिमेंट/चुना/दगड/विटांची भिंत व टिनाचे छत',N'Cement/Lime/Stone/Brick Wall with Tin Roof',3, 0),
(4, N'D',  N'कुडाचे लाकडी फाट्याचे कच्चेघर',N'Temporary House with Wooden Planks',4, 0),
(5, N'E',  N'कुडाचे',N'Temporary Structure',      5, 0),
(6, N'OP', N'खुला भूखंड',N'Open Plot',6, 1);

SET IDENTITY_INSERT [PTIS].[ConstructionTypeMaster] OFF;



SET IDENTITY_INSERT [PTIS].[PropertyCategoryMaster] ON;

INSERT INTO [PTIS].[PropertyCategoryMaster]
    ([Id], [PropertyCategoryName], [IsProtected])
SELECT v.*
FROM (
    VALUES
        (1, N'Apartment', 1),
        (2, N'Individual', 1),
        (3, N'Industry', 1),
        (4, N'Plot', 1)
       ) AS v ([Id], [PropertyCategoryName], [IsProtected])
WHERE NOT EXISTS (
    SELECT 1
    FROM [PTIS].[PropertyCategoryMaster] pcm
    WHERE pcm.[Id] = v.[Id]
);

SET IDENTITY_INSERT [PTIS].[PropertyCategoryMaster] OFF;

SET IDENTITY_INSERT [PTIS].[SubTypeOfUseMaster] ON;

;WITH Seed(Id, [Description], [DescriptionEnglish], TypeOfUseCode, CreatedBy, UpdatedBy, UpdatedDate, SearchKey, SearchSequence) AS
(
    SELECT * FROM (VALUES

 (186, N'मंदिर', N'Temple', N'T', 1, 67, CAST(N'2023-02-09T17:38:44.260' AS DateTime), N'M', 1),
  (187, N'मस्जीद', N'Mosque', N'T', 1, NULL, NULL, N'M', 2),
  (188, N'इदगाह', N'Eidgah', N'T', 1, NULL, NULL, N'E', 3),
  (189, N'चर्च ', N'Church', N'T', 1, NULL, NULL, N'C', 3),
  (190, N'गुरुद्वारा', N'Gurudwara', N'T', 1, NULL, NULL, N'G', 4),
  (191, N'बौद्ध विहार', N'Buddhist Monastery', N'T', 1, NULL, NULL, N'B', 5),
  (192, N'विहीर', N'Well', N'N', 1, 67, CAST(N'2023-02-09T12:19:23.693' AS DateTime), N'M', 6),
  (193, N'समाज भवन', N'Community Hall', N'T', 1, NULL, NULL, N'S', 7),
  (222, N'चक्की', N'Flour Mill', N'S', 1, NULL, NULL, N'C', 1),
  (223, N'चिकण मटण सेंटर', N'Chicken Mutton Center', N'S', 1, NULL, NULL, N'C', 2),
  (224, N'भाजीपाला दुकाण', N'Vegetable Shop', N'S', 1, NULL, NULL, N'B', 1),
  (227, N'वाईन शॉप', N'Wine Shop', N'S', 1, NULL, NULL, N'W', 1),
  (228, N'होम अप्लायन्स', N'Home Appliances', N'S', 1, NULL, NULL, N'H', 1),
  (230, N'ज्वेलरी', N'Jewellery', N'S', 1, NULL, NULL, N'J', 2),
  (231, N'शापीग सेंटर/मार्ट', N'Shopping Center / Mart', N'S', 1, NULL, NULL, N'S', 3),
  (233, N'प्रेस', N'Press', N'S', 1, NULL, NULL, N'P', 3),
  (234, N'लॉन्डी', N'Laundry', N'S', 1, NULL, NULL, N'L', 1),
  (235, N'राष्ट्रीयकृत ', N'Nationalized Bank', N'B', 1, NULL, NULL, N'', 1),
  (238, N'पतपेढी', N'Credit Society', N'B', 1, NULL, NULL, N'P', 2),
  (239, N'ए.टी.एम.', N'ATM', N'B', 1, NULL, NULL, N'A', 1),
  (273, N'उत्पादन सेवा', N'Manufacturing Service', N'I', 1, NULL, NULL, N'', 0),
  (280, N'इतर उद्योग', N'Other Industry', N'I', 1, NULL, NULL, N'', 0),
  (286, N'जलतरण तलाव', N'Swimming Pool', N'N', 1, NULL, NULL, N'', 0),
  (287, N'कार्यालय', N'Office', N'N', 1, 70, CAST(N'2024-06-26T15:18:20.117' AS DateTime), N'', 0),
  (288, N'शाळा', N'School', N'N', 1, NULL, NULL, N'', 0),
  (289, N'गार्डन', N'Garden', N'N', 1, NULL, NULL, N'', 0),
  (290, N'शौचालय ', N'Toilet', N'N', 1, NULL, NULL, N'', 0),
  (292, N'अग्निशमन विभाग', N'Fire Department', N'N', 1, NULL, NULL, N'', 0),
  (293, N'सांस्कुतीक भवन', N'Cultural Hall', N'N', 1, NULL, NULL, N'', 0),
  (294, N'पाण्याची टाकी', N'Water Tank', N'N', 1, NULL, NULL, N'', 0),
  (295, N'पुतळा', N'Statue', N'N', 1, NULL, NULL, N'', 0),
  (299, N'खाजगी गोडाऊन', N'Private Godown', N'GO', 1, NULL, NULL, N'', 0),
  (300, N'शासकीय गोडाऊन', N'Government Godown', N'GO', 1, NULL, NULL, N'', 0),
  (311, N'सामुदायिक आरोग्य केंद्र', N'Community Health Center', N'D', 1, NULL, NULL, N'', 0),
  (313, N' हृदयरोगतज्ज्ञ', N'Cardiologist', N'D', 1, NULL, NULL, N'', 0),
  (315, N'त्वचारोगतज्ज्ञ ', N'Dermatologist', N'D', 1, NULL, NULL, N'', 0),
  (317, N'बालरोगतज्ञ ', N'Pediatrician', N'D', 1, NULL, NULL, N'', 0),
  (318, N'नवजात तज्ज्ञ', N'Neonatologist', N'D', 1, NULL, NULL, N'', 0),
  (319, N'न्यूरोलॉजिस्ट ', N'Neurologist', N'D', 1, NULL, NULL, N'', 0),
  (321, N'ऑर्थोपेडिक सर्जन ', N'Orthopedic Surgeon', N'D', 1, NULL, NULL, N'', 0),
  (324, N'एंडोक्राइनोलॉजिस्ट ', N'Endocrinologist', N'D', 1, NULL, NULL, N'', 0),
  (326, N'नर्सिंग होम', N'Nursing Home', N'D', 1, NULL, NULL, N'', 0),
  (328, N'पॅथोलॉजी लॅब', N'Pathology Lab', N'D', 1, 58, CAST(N'2023-01-26T13:37:58.977' AS DateTime), N'', 0),
  (330, N'दंतवैद्य / ऑर्थोडेंटिस्ट ', N'Dentist / Orthodontist', N'D', 1, NULL, NULL, N'', 0),
  (332, N'स्त्रीरोगतज्ञ ', N'Gynecologist', N'D', 1, NULL, NULL, N'', 0),
  (336, N'ऑन्कोलॉजिस्ट ', N'Oncologist', N'D', 1, NULL, NULL, N'', 0),
  (338, N' रेडिओलॉजिस्ट ', N'Radiologist', N'D', 1, NULL, NULL, N'', 0),
  (339, N'पल्मोनोलॉजिस्ट', N'Pulmonologist', N'D', 1, NULL, NULL, N'', 0),
  (343, N'वसतीगृह ', N'Hostel', N'GR', 1, NULL, NULL, N'', 0),
  (371, N'जेंट्स  पार्लर', N'Gents Parlour', N'S', NULL, NULL, NULL, N'J', 1),
  (373, N'खाजगी ', N'Private Bank', N'B', 1, NULL, NULL, N'', 0),
  (374, N'पंतसंस्था', N'Credit Society', N'B', 1, NULL, NULL, N'', 0),
  (387, N'हार्ड वेअर', N'Hardware', N'S', 59, NULL, NULL, N'', 0),
  (390, N'स्पेयर पार्ट्स', N'Spare Parts', N'S', 59, NULL, NULL, N'', 0),
  (399, N'साडी शॉप', N'Saree Shop', N'S', 59, NULL, NULL, N'', 0),
  (402, N'एजन्सीज', N'Agencies', N'S', 59, NULL, NULL, N'', 0),
  (405, N'स्वीटमार्ट अँड नमकीन', N'Sweet Mart and Namkeen', N'S', 59, NULL, NULL, N'', 0),
  (408, N'शूज शॉप', N'Shoes Shop', N'S', 59, NULL, NULL, N'', 0),
  (414, N'बिल्डिंग मटेरियल सप्लायर', N'Building Material Supplier', N'S', 59, NULL, NULL, N'', 0),
  (417, N'फ्लॉवर शॉप', N'Flower Shop', N'S', 59, NULL, NULL, N'', 0),
  (423, N'बॅग हाऊस, शॉप', N'Bag House / Shop', N'S', 59, NULL, NULL, N'', 0),
  (426, N'टॅट्यू शॉप', N'Tattoo Shop', N'S', 59, NULL, NULL, N'', 0),
  (456, N'कम्प्युटर', N'Computer', N'S', 59, NULL, NULL, N'', 0),
  (467, N'तक्रार निवारण केंद्र', N'Grievance Redressal Center', N'S', 59, NULL, NULL, N'', 0),
  (470, N'ग्राहक सेवा केंद्र/सेतु', N'Customer Service Center / Setu', N'S', 59, NULL, NULL, N'', 0),
  (475, N'बुटीक अँड ड्रेस डिझायनिंग', N'Boutique and Dress Designing', N'S', 59, NULL, NULL, N'', 0),
  (483, N'ड्रायविंग स्कूल', N'Driving School', N'S', 59, NULL, NULL, N'', 0),
  (486, N'दुकान गाळे', N'Shop Units', N'S', 59, NULL, NULL, N'', 0),
  (510, N'सहकारी', N'Co-operative Bank', N'B', NULL, NULL, NULL, N'', 0),
  (526, N'टाइल्स व मार्बल', N'Tiles and Marble', N'I', NULL, NULL, NULL, N'', 0),
  (528, N'प्रायमरी शाळा', N'Primary School', N'EG', 55, NULL, NULL, N'', 0),
  (530, N'अग्रीकल्चरल', N'Agricultural Industry', N'I', 55, NULL, NULL, N'', 0),
  (531, N'फुड', N'Food Industry', N'I', 55, NULL, NULL, N'', 0),
  (533, N'कॉलेज - मेडिकल', N'Medical College', N'EP', 55, NULL, NULL, N'', 0),
  (534, N'कॉलेज -इंजिनीरिंग', N'Engineering College', N'EP', 55, NULL, NULL, N'', 0),
  (535, N'हायस्कूल', N'High School', N'EP', 55, NULL, NULL, N'', 0),
  (536, N'कॉलेज- इतर', N'Other College', N'EP', 55, NULL, NULL, N'', 0),
  (537, N'प्रायमरी स्कूल', N'Primary School', N'EP', 55, NULL, NULL, N'', 0),
  (538, N'विद्यापीठ', N'University', N'EP', 55, NULL, NULL, N'', 0),
  (539, N'प्रशिक्षण संस्था', N'Training Institute', N'EP', 55, NULL, NULL, N'', 0),
  (540, N'अंगणवारी/प्रीस्कूल', N'Anganwadi / Preschool', N'EP', 55, NULL, NULL, N'', 0),
  (542, N'अॅडव्होकेट ऑफिस', N'Advocate Office', N'O', 55, NULL, NULL, N'', 0),
  (546, N'कार्यालय इतर', N'Other Office', N'O', 55, NULL, NULL, N'', 0),
  (548, N'गोडावून', N'Godown', N'I', 55, NULL, NULL, N'', 0),
  (549, N'रेस्टोरेंट', N'Restaurant', N'H', 55, NULL, NULL, N'', 0),
  (551, N'रेस्टोरेंट व बार', N'Restaurant and Bar', N'H', 55, NULL, NULL, N'', 0),
  (553, N'लॉज', N'Lodge', N'H', 55, NULL, NULL, N'', 0),
  (555, N'भोजनालय', N'Eatery', N'H', 55, NULL, NULL, N'', 0),
  (556, N'कॅफे', N'Cafe', N'H', 55, NULL, NULL, N'', 0),
  (558, N'शासकीय रुग्णालय', N'Government Hospital', N'GC', 55, NULL, NULL, N'', 0),
  (560, N'कोर्ट', N'Court', N'GC', 55, NULL, NULL, N'', 0),
  (561, N'तहसिल कार्यालय', N'Tehsil Office', N'GC', 55, NULL, NULL, N'', 0),
  (562, N'पंचायत समिती', N'Panchayat Samiti', N'GC', 55, NULL, NULL, N'', 0),
  (563, N'जिल्हा परिषद ऑफीस', N'District Council Office', N'GC', 55, NULL, NULL, N'', 0),
  (565, N'पोलीस स्टेशन', N'Police Station', N'GC', 55, NULL, NULL, N'', 0),
  (566, N'वन विभाग', N'Forest Department', N'GC', 55, NULL, NULL, N'', 0),
  (568, N'पोलीस चौकी', N'Police Outpost', N'CG', 55, NULL, NULL, N'', 0),
  (569, N'जेल', N'Jail', N'CG', 55, NULL, NULL, N'', 0),
  (570, N'बिएसएनएल ऑफीस', N'BSNL Office', N'CG', 55, NULL, NULL, N'', 0),
  (571, N'रेल स्टेशन जक्शन', N'Railway Station Junction', N'CG', 55, NULL, NULL, N'', 0),
  (572, N'आकाशवाणी', N'Radio Station', N'CG', 55, NULL, NULL, N'', 0),
  (577, N'स्मशानभूमी ', N'Crematorium', N'N', 55, NULL, NULL, N'N', 2),
  (578, N'मदरसा', N'Madrasa', N'EP', 58, NULL, NULL, N'', 0),
  (580, N'अपार्टमेंट सदनिका', N'Apartment Unit', N'R', 58, NULL, NULL, N'R', 2),
  (581, N'पडीत', N'Vacant / Unused', N'R', 58, NULL, NULL, N'R', 3),
  (582, N'गोठा', N'Cattle Shed', N'R', 58, NULL, NULL, N'R', 4),
  (583, N'बंगला', N'Bungalow', N'R', 58, NULL, NULL, N'R', 5),
  (584, N'आश्रम', N'Ashram', N'R', 58, 67, CAST(N'2023-02-09T17:35:15.180' AS DateTime), N'R', 6),
  (585, N'गृहनिर्माण योजना /घरकुल', N'Housing Scheme / House', N'R', 58, NULL, NULL, N'R', 7),
  (586, N'जिम', N'Gym', N'N', 67, NULL, NULL, N'', 0),
  (587, N'चालु बांधकाम', N'Under Construction', N'N', 67, NULL, NULL, N'', 0),
  (588, N'sports academy', N'Sports Academy', N'N', 98, NULL, NULL, N'', 0),
  (590, N'बिछायत केंद्र', N'Tent / Decoration Center', N'S', 67, NULL, NULL, N'', 0),
  (591, N'कॅटरर्स/मेस', N'Caterers / Mess', N'S', 67, NULL, NULL, N'', 0),
  (592, N'मटन शोप', N'Mutton Shop', N'S', 67, NULL, NULL, N'', 0),
  (593, N'टेलेर्स', N'Tailors', N'S', 67, NULL, NULL, N'', 0),
  (595, N'फॅब्रिकेशन', N'Fabrication', N'S', 67, NULL, NULL, N'', 0),
  (596, N'फटाका सेंटर', N'Firecracker Center', N'S', 67, NULL, NULL, N'', 0),
  (598, N'स्वत धान्य दुकान', N'Fair Price Grain Shop', N'S', 98, NULL, NULL, N'', 0),
  (599, N'मंदबुद्धी विद्यालय', N'Special School', N'EP', 98, NULL, NULL, N'', 0),
  (600, N'वाचनालय', N'Library', N'N', 98, NULL, NULL, N'', 0),
  (601, N'पम्प हाऊस', N'Pump House', N'N', 98, NULL, NULL, N'', 0),
  (602, N'गिफ्ट सेंटर', N'Gift Center', N'S', 98, NULL, NULL, N'', 0),
  (604, N'होमिओपॅथिक', N'Homeopathic Clinic', N'D', 98, NULL, NULL, N'', 0),
  (605, N'फिजिओथेरपी', N'Physiotherapy', N'D', 98, NULL, NULL, N'', 0),
  (606, N'खुला भुखंड', N'Open Plot', N'N', 98, NULL, NULL, N'', 0),
  (607, N'नेत्रालय', N'Eye Hospital', N'D', 98, NULL, NULL, N'', 0),
  (608, N'ऑप्टीकल', N'Optical Shop', N'S', 98, NULL, NULL, N'', 0),
  (609, N'फोटो स्टुडीओ', N'Photo Studio', N'S', 67, NULL, NULL, N'', 0),
  (610, N'बुक डेपो', N'Book Depot', N'S', 67, NULL, NULL, N'', 0),
  (612, N'वेल्डींग', N'Welding', N'S', 98, NULL, NULL, N'', 0),
  (617, N'पंचकर्म तज्ञ', N'Panchakarma Specialist', N'D', 67, NULL, NULL, N'', 0),
  (618, N'इलेक्ट्रोनिक', N'Electronics', N'S', 67, NULL, NULL, N'', 0),
  (619, N'ट्रेडर्स', N'Traders', N'S', 98, NULL, NULL, N'', 0),
  (621, N'ट्रॅव्हल एजन्सी', N'Travel Agency', N'S', 98, NULL, NULL, N'', 0),
  (622, N'ढाबा', N'Dhaba', N'H', 98, NULL, NULL, N'', 0),
  (623, N'पानपोई', N'Drinking Water Point', N'N', 98, NULL, NULL, N'', 0),
  (624, N'मार्बल शॉप', N'Marble Shop', N'S', 72, NULL, NULL, N'', 0),
  (628, N'आयुर्वेदिक', N'Ayurvedic Clinic', N'D', 98, NULL, NULL, N'', 0),
  (629, N'चायनीज शॉप', N'Chinese Food Shop', N'S', 72, NULL, NULL, N'', 0),
  (630, N'शासकीय इमारत', N'Government Building', N'GC', 72, NULL, NULL, N'', 0),
  (631, N'भंगार व रद्दी दुकान', N'Scrap and Waste Paper Shop', N'S', 74, NULL, NULL, N'', 0),
  (632, N'कुकुट पालन', N'Poultry Farming', N'S', 74, NULL, NULL, N'', 0),
  (633, N'पान सेंटर', N'Pan Center', N'S', 72, NULL, NULL, N'', 0),
  (634, N'तेल मिल', N'Oil Mill', N'S', 67, NULL, NULL, N'', 0),
  (635, N'वृक्ष वाटिका', N'Plant Nursery', N'S', 67, NULL, NULL, N'', 0),
  (636, N'नवोदय विद्यालय', N'Navodaya School', N'CG', 58, NULL, NULL, N'', 0),
  (637, N'धोबी घाट', N'Dhobi Ghat', N'S', 142, NULL, NULL, N'', 0),
  (638, N'लायब्ररी', N'Library', N'EP', 61, NULL, NULL, N'', 0),
  (639, N'गाडी शोरूम', N'Vehicle Showroom', N'S', 142, NULL, NULL, N'', 0),
  (640, N'रक्तपेढी', N'Blood Bank', N'D', 68, NULL, NULL, N'', 0),
  (641, N'पॉलीटेकनिक', N'Polytechnic', N'EP', 111, NULL, NULL, N'', 0),
  (642, N'सर्व्हिसिंग सेंटर', N'Servicing Center', N'S', 111, NULL, NULL, N'', 0),
  (644, N'कॉलेज- आय.टी.आय.', N'ITI College', N'EG', 68, NULL, NULL, N'', 0),
  (645, N'प्रशिक्षण केंद्र', N'Training Center', N'GC', 102, NULL, NULL, N'', 0),
  (646, N'स्टाफ क्वार्टर', N'Staff Quarters', N'R', 68, NULL, NULL, N'', 0),
  (647, N'विश्राम गृह', N'Rest House', N'GC', 68, NULL, NULL, N'', 0),
  (648, N'ऑडिटोरियम', N'Auditorium', N'EP', 68, NULL, NULL, N'', 0),
  (649, N'उपहार गृह', N'Canteen', N'GC', 68, NULL, NULL, N'', 0),
  (650, N'कॉलेज- सायन्स', N'Science College', N'EP', 68, NULL, NULL, N'', 0),
  (651, N'सभागृह', N'Hall', N'GC', 68, NULL, NULL, N'', 0),
  (652, N'कॉलेज-उद्यानविद्या', N'Horticulture College', N'EP', 68, NULL, NULL, N'', 0),
  (653, N'मेस', N'Mess', N'H', 142, NULL, NULL, N'', 0),
  (654, N'ऑफिस', N'Office', N'I', 68, NULL, NULL, N'', 0),
  (656, N'प्लासटिक इंडस्ट्री', N'Plastic Industry', N'I', 68, NULL, NULL, N'', 0),
  (657, N'मेटल इंडस्ट्री', N'Metal Industry', N'I', 68, NULL, NULL, N'', 0),
  (658, N'इलेक्ट्रोड्स इंडस्ट्री', N'Electrodes Industry', N'I', 68, NULL, NULL, N'', 0),
  (659, N'दालमिल इंडस्ट्री', N'Dal Mill Industry', N'I', 68, NULL, NULL, N'', 0),
  (660, N'पेपर इंडस्ट्री', N'Paper Industry', N'I', 68, NULL, NULL, N'', 0),
  (661, N'गारमेंट्स इंडस्ट्री', N'Garments Industry', N'I', 68, NULL, NULL, N'', 0),
  (662, N'वेल्डींग, इंजिनिअरिंग वर्क', N'Welding and Engineering Work', N'I', 68, NULL, NULL, N'', 0),
  (663, N'नेल्स इंडस्ट्री', N'Nails Industry', N'I', 68, NULL, NULL, N'', 0),
  (664, N'कॉटन मिल इंडस्ट्री', N'Cotton Mill Industry', N'I', 68, NULL, NULL, N'', 0),
  (665, N'ऑईल मिल', N'Oil Mill', N'I', 68, NULL, NULL, N'', 0),
  (666, N'ड्रग्स अॅण्ड केमिकल्स', N'Drugs and Chemicals', N'I', 68, NULL, NULL, N'', 0),
  (667, N'फर्निचर इंडस्ट्रीज', N'Furniture Industries', N'I', 68, NULL, NULL, N'', 0),
  (668, N'पॉलीमेट इंडस्ट्री', N'Polymet Industry', N'I', 68, NULL, NULL, N'', 0),
  (669, N'मुकबधीर विद्यालय', N'Deaf and Mute School', N'EP', 68, NULL, NULL, N'', 0),
  (670, N'सिमेंट इंडस्ट्री', N'Cement Industry', N'I', 68, NULL, NULL, N'', 0),
  (671, N'कुलर इंडस्ट्री', N'Cooler Industry', N'I', 68, NULL, NULL, N'', 0),
  (672, N'फायर टावर', N'Fire Tower', N'GR', 68, NULL, NULL, N'', 0),
  (673, N'टावर', N'Tower', N'GC', 68, NULL, NULL, N'', 0),
  (674, N'कुमकुम इंडस्ट्री', N'Kumkum Industry', N'I', 68, NULL, NULL, N'', 0),
  (675, N'धार्मिक स्थळ', N'Religious Place', N'N', 68, NULL, NULL, N'', 0),
  (677, N'महाविद्यालय', N'College', N'EG', 111, NULL, NULL, N'', 0),
  (678, N'कर्करोग', N'Cancer Clinic', N'D', 98, NULL, NULL, N'', 0),
  (679, N'टेक्सटाईल इंडस्ट्री', N'Textile Industry', N'I', 58, NULL, NULL, N'', 0),
  (681, N'वीट भट्टी', N'Brick Kiln', N'I', 68, NULL, NULL, N'', 0),
  (683, N'फार्म हाऊस', N'Farm House', N'R', 68, NULL, NULL, N'', 0),
  (684, N'व्यायाम शाळा', N'Gymnasium', N'EG', 68, NULL, NULL, N'', 0),
  (685, N'ड्राय फ्रुट्स शॉप', N'Dry Fruits Shop', N'S', 74, NULL, NULL, N'', 0),
  (686, N'प्लायवुड', N'Plywood', N'S', 68, NULL, NULL, N'', 0),
  (687, N'भक्त निवास', N'Pilgrim Accommodation', N'T', 68, NULL, NULL, N'', 0),
  (689, N'स्टील इंडस्ट्रीज', N'Steel Industries', N'I', 72, NULL, NULL, N'', 0),
  (691, N'दुकान', N'Shop', N'CG', 74, NULL, NULL, N'', 0),
  (692, N'पोस्ट ऑफिस', N'Post Office', N'CG', 110, NULL, NULL, N'', 0),
  (693, N'व्याचमन रूम', N'Watchman Room', N'GR', 98, NULL, NULL, N'', 0),
  (694, N'निवासी', N'Residential', N'CG', 98, NULL, NULL, N'', 0),
  (695, N'स्पोर्ट्स अकॅडमी', N'Sports Academy', N'EG', 72, NULL, NULL, N'', 0),
  (697, N'कारागृह', N'Prison', N'GC', 74, NULL, NULL, N'', 0),
  (698, N'पेय तयार करणे / पेय खाद्यपदार्थ विक्री', N'Beverage Preparation / Beverage and Food Sales', N'H', NULL, NULL, NULL, N'', 0),
  (699, N'खानावळ', N'Eatery', N'H', NULL, NULL, NULL, N'', 0),
  (700, N'खानावळ / बार', N'Eatery / Bar', N'H', NULL, NULL, NULL, N'', 0),
  (701, N'खानावळ / बार / लौजिंग', N'Eatery / Bar / Lodging', N'H', NULL, NULL, NULL, N'', 0),
  (702, N'मोबाईल व्हन वर  खाद्यपदार्थ विक्री करणे', N'Food Sales from Mobile Van', N'H', NULL, NULL, NULL, N'', 0),
  (703, N'आईसक्रीम विक्रेता  ', N'Ice Cream Seller', N'H', NULL, NULL, NULL, N'', 0),
  (704, N'आईस्क्रीम शॉप', N'Ice Cream Shop', N'H', NULL, NULL, NULL, N'', 0),
  (705, N'नवीन हॉटेल ना हरकत दाखला', N'New Hotel No Objection Certificate', N'H', NULL, NULL, NULL, N'', 0),
  (706, N'हॉटेल परवाना / नुतनीकरण ना हरकत दाखला', N'Hotel Licence / Renewal No Objection Certificate', N'H', NULL, NULL, NULL, N'', 0),
  (707, N'अग्रो खाद्य पदार्थाचे दुकान', N'Agro Food Products Shop', N'H', NULL, NULL, NULL, N'', 0),
  (708, N'केटरर्स', N'Caterers', N'H', NULL, NULL, NULL, N'', 0),
  (709, N'कॅटरर्स अँड रेस्टोरंट', N'Caterers and Restaurant', N'H', NULL, NULL, NULL, N'', 0),
  (710, N'केटरर्स शॉप ', N'Caterers Shop', N'H', NULL, NULL, NULL, N'', 0),
  (711, N'कॅटरेस ', N'Caterers', N'H', NULL, NULL, NULL, N'', 0),
  (712, N'कॅंटीन', N'Canteen', N'H', NULL, NULL, NULL, N'', 0),
  (713, N'आइस क्रीम', N'Ice Cream', N'H', NULL, NULL, NULL, N'', 0),
  (714, N'आइस क्रीम पार्लर', N'Ice Cream Parlour', N'H', NULL, NULL, NULL, N'', 0),
  (715, N'आइसस्क्रीम', N'Ice Cream', N'H', NULL, NULL, NULL, N'', 0),
  (716, N'केक , फ्रूइट्स शॉप', N'Cake and Fruits Shop', N'H', NULL, NULL, NULL, N'', 0),
  (717, N'केक मॅनिफॅकचरिंग', N'Cake Manufacturing', N'H', NULL, NULL, NULL, N'', 0),
  (718, N'केक शॉप', N'Cake Shop', N'H', NULL, NULL, NULL, N'', 0),
  (720, N'कॉफी कॅफे', N'Coffee Cafe', N'H', NULL, NULL, NULL, N'', 0),
  (721, N'कॅफे द बेकरी', N'Cafe and Bakery', N'H', NULL, NULL, NULL, N'', 0),
  (722, N'कॅफे/रेसटोरेंट', N'Cafe / Restaurant', N'H', NULL, NULL, NULL, N'', 0),
  (723, N'पिझ्झा शॉप', N'Pizza Shop', N'H', NULL, NULL, NULL, N'', 0),
  (724, N'पिझ्झा हट', N'Pizza Hut', N'H', NULL, NULL, NULL, N'', 0),
  (725, N'पिझा हाऊस', N'Pizza House', N'H', NULL, NULL, NULL, N'', 0),
  (726, N'कोल्ड्रिंग  डीलरशिप', N'Cold Drink Dealership', N'H', NULL, NULL, NULL, N'', 0),
  (727, N'कोल्डरिंग शॉप', N'Cold Drink Shop', N'H', NULL, NULL, NULL, N'', 0),
  (728, N'पोळी भाजी केंद्र', N'Chapati Vegetable Center', N'H', NULL, NULL, NULL, N'', 0),
  (729, N'पोळी भाजी सेंटर', N'Chapati Vegetable Center', N'H', NULL, NULL, NULL, N'', 0),
  (730, N'पोळी-भाजी केंद्र ', N'Chapati Vegetable Center', N'H', NULL, NULL, NULL, N'', 0),
  (731, N'फास्ट फूड अँड हॉटेल', N'Fast Food and Hotel', N'H', NULL, NULL, NULL, N'', 0),
  (732, N'फास्ट फूड सेंटर', N'Fast Food Center', N'H', NULL, NULL, NULL, N'', 0),
  (733, N'फास्टफूड आऊटलेट', N'Fast Food Outlet', N'H', NULL, NULL, NULL, N'', 0),
  (734, N'फास्टफूड कोर्नर', N'Fast Food Corner', N'H', NULL, NULL, NULL, N'', 0),
  (735, N'बेकरी', N'Bakery', N'H', NULL, NULL, NULL, N'', 0),
  (736, N'बेकरी अँड केक शॉप', N'Bakery and Cake Shop', N'H', NULL, NULL, NULL, N'', 0),
  (737, N'बेकरी शॉप', N'Bakery Shop', N'H', NULL, NULL, NULL, N'', 0),
  (738, N'चहा , पाणीपुरी शॉप', N'Tea and Pani Puri Shop', N'H', NULL, NULL, NULL, N'', 0),
  (739, N'चहा शॉप', N'Tea Shop', N'H', NULL, NULL, NULL, N'', 0),
  (740, N'चहा सेंटर आणि वडापाव ', N'Tea Center and Vada Pav', N'H', NULL, NULL, NULL, N'', 0),
  (741, N'चाय दुकान', N'Tea Shop', N'H', NULL, NULL, NULL, N'', 0),
  (742, N'चाय नाश्ता सेंटर', N'Tea and Snacks Center', N'H', NULL, NULL, NULL, N'', 0),
  (743, N'चायनिज शॉप ', N'Chinese Food Shop', N'H', NULL, NULL, NULL, N'', 0),
  (744, N'चायनिज सेंटर ', N'Chinese Food Center', N'H', NULL, NULL, NULL, N'', 0),
  (745, N'चायनीज सेंटर', N'Chinese Food Center', N'H', NULL, NULL, NULL, N'', 0),
  (746, N'ज्युस सेंटर', N'Juice Center', N'H', NULL, NULL, NULL, N'', 0),
  (747, N'ज्यूस सेंटर', N'Juice Center', N'H', NULL, NULL, NULL, N'', 0),
  (748, N'खाद्य विक्री', N'Food Sales', N'H', NULL, NULL, NULL, N'', 0),
  (749, N'खाद्यविक्रि', N'Food Sales', N'H', NULL, NULL, NULL, N'', 0),
  (750, N'खाद्यविक्री ', N'Food Sales', N'H', NULL, NULL, NULL, N'', 0),
  (751, N'खाद्यविक्री - गोडाऊन ', N'Food Sales - Godown', N'H', NULL, NULL, NULL, N'', 0),
  (752, N'खाद्याविक्रि पार्सल ', N'Food Parcel Sales', N'H', NULL, NULL, NULL, N'', 0),
  (753, N'खाद्याविक्रि/खानावळ', N'Food Sales / Eatery', N'H', NULL, NULL, NULL, N'', 0),
  (754, N'खाद्याविक्री ', N'Food Sales', N'H', NULL, NULL, NULL, N'', 0),
  (755, N'खानावळ मध्यविक्री', N'Eatery / Food Sales', N'H', NULL, NULL, NULL, N'', 0),
  (756, N'टि स्टॉल ', N'Tea Stall', N'H', NULL, NULL, NULL, N'', 0),
  (757, N'टी अँड स्नॅक्स सेंटर', N'Tea and Snacks Center', N'H', NULL, NULL, NULL, N'', 0),
  (758, N'टी स्टॉल', N'Tea Stall', N'H', NULL, NULL, NULL, N'', 0),
  (759, N'मिठाई दुकान', N'Sweet Shop', N'H', NULL, NULL, NULL, N'', 0),
  (761, N'बार अँन्ड रेस्टोरेंन्ट', N'Bar and Restaurant', N'H', NULL, NULL, NULL, N'', 0),
  (762, N'चहा नाष्टा सेंटर', N'Tea and Snacks Center', N'H', NULL, NULL, NULL, N'', 0),
  (763, N'टी अँड स्नॅक्स', N'Tea and Snacks', N'H', NULL, NULL, NULL, N'', 0),
  (764, N'भेळ्पुरी', N'Bhel Puri', N'H', NULL, NULL, NULL, N'', 0),
  (765, N'हॉटेल (उपहारगृह)', N'Hotel / Restaurant', N'H', NULL, NULL, NULL, N'', 0),
  (766, N'हॉटेल / स्वीट मार्ट', N'Hotel / Sweet Mart', N'H', NULL, NULL, NULL, N'', 0),
  (767, N'हॉटेल अँड रेस्टोरंट', N'Hotel and Restaurant', N'H', NULL, NULL, NULL, N'', 0),
  (769, N'हॉटेल(गोडाऊन)', N'Hotel Godown', N'H', NULL, NULL, NULL, N'', 0),
  (770, N'हॉटेल, बार व लॉंजिंग', N'Hotel, Bar and Lodging', N'H', NULL, NULL, NULL, N'', 0),
  (771, N'हॉटेल/खानावळ', N'Hotel / Eatery', N'H', NULL, NULL, NULL, N'', 0),
  (772, N'हॉटेल/रेस्टॉरंट/लॉज', N'Hotel / Restaurant / Lodge', N'H', NULL, NULL, NULL, N'', 0),
  (773, N'निवासी व हॉटेल', N'Residential and Hotel', N'H', NULL, NULL, NULL, N'', 0),
  (774, N'बार अँड रेस्टॉरंट', N'Bar and Restaurant', N'H', NULL, NULL, NULL, N'', 0),
  (775, N'फुड मार्ट', N'Food Mart', N'H', NULL, NULL, NULL, N'', 0),
  (776, N'फूड मार्ट ', N'Food Mart', N'H', NULL, NULL, NULL, N'', 0),
  (777, N'फूड शॉप', N'Food Shop', N'H', NULL, NULL, NULL, N'', 0),
  (778, N'फुड्स कोर्नर', N'Foods Corner', N'H', NULL, NULL, NULL, N'', 0),
  (779, N'भाजी पोळी केंद्र', N'Vegetable Chapati Center', N'H', NULL, NULL, NULL, N'', 0),
  (780, N'स्वीट मार्ट', N'Sweet Mart', N'H', NULL, NULL, NULL, N'', 0),
  (781, N'स्वीट्स', N'Sweets', N'H', NULL, NULL, NULL, N'', 0),
  (782, N'स्वीट्स , खाद्यविक्री', N'Sweets, Food Sales', N'H', NULL, NULL, NULL, N'', 0),
  (783, N'स्वीट्स अँड नमकिन शॉप ', N'Sweets and Namkeen Shop', N'H', NULL, NULL, NULL, N'', 0),
  (784, N'स्वीट्स अँड फरसान', N'Sweets and Farsan', N'H', NULL, NULL, NULL, N'', 0),
  (785, N'स्वीट्स अँड फरसान शॉप', N'Sweets and Farsan Shop', N'H', NULL, NULL, NULL, N'', 0),
  (786, N'स्वीट्स कॉर्नर', N'Sweets Corner', N'H', NULL, NULL, NULL, N'', 0),
  (787, N'स्वीट्स, ड्रायफृट्स, खाद्याविक्रि ', N'Sweets, Dry Fruits and Food Sales', N'H', NULL, NULL, NULL, N'', 0),
  (788, N'सँडविच सेंटर', N'Sandwich Center', N'H', NULL, NULL, NULL, N'', 0),
  (789, N'स्नॅक्स कॉर्नर', N'Snacks Corner', N'H', NULL, NULL, NULL, N'', 0),
  (790, N'स्नॅक्स कोर्नर ', N'Snacks Corner', N'H', NULL, NULL, NULL, N'', 0),
  (791, N'स्नॅक्स दुकान', N'Snacks Shop', N'H', NULL, NULL, NULL, N'', 0),
  (792, N'स्नॅक्स सेंटर', N'Snacks Center', N'H', NULL, NULL, NULL, N'', 0),
  (793, N'मिसळ सेंटर', N'Misal Center', N'H', NULL, NULL, NULL, N'', 0),
  (794, N'मिसळ स्नॅक्स कॉर्नर ', N'Misal Snacks Corner', N'H', NULL, NULL, NULL, N'', 0),
  (795, N'वडापाव सेंटर', N'Vada Pav Center', N'H', NULL, NULL, NULL, N'', 0),
  (796, N'फॅमिली रेस्टारंट', N'Family Restaurant', N'H', NULL, NULL, NULL, N'', 0),
  (797, N'फ्रूइट्स अँड स्नॅक्स', N'Fruits and Snacks', N'H', NULL, NULL, NULL, N'', 0),
  (798, N'बर्गर', N'Burger', N'H', NULL, NULL, NULL, N'', 0),
  (799, N'बिर्याणी शॉप', N'Biryani Shop', N'H', NULL, NULL, NULL, N'', 0),
  (800, N'बिर्याणी सेंटर', N'Biryani Center', N'H', NULL, NULL, NULL, N'', 0),
  (801, N'बिर्यानी शॉप', N'Biryani Shop', N'H', NULL, NULL, NULL, N'', 0),
  (802, N'राजू शॉप', N'Raju Shop', N'S', NULL, NULL, NULL, N'', 0),
  (803, N'रामकृष्ण बिसवाल/शिवानी प्रियदर्शनी बिसवाल', N'Ramakrishna Biswal / Shivani Priyadarshini Biswal', N'S', NULL, NULL, NULL, N'', 0),
  (804, N'रिअर इस्टेड', N'Real Estate', N'S', NULL, NULL, NULL, N'', 0),
  (805, N'रिअल इस्टेट', N'Real Estate', N'S', NULL, NULL, NULL, N'', 0),
  (806, N'रिअल इस्टेट अँड कॅटरिंग ', N'Real Estate and Catering', N'S', NULL, NULL, NULL, N'', 0),
  (807, N'रिअल इस्टेट ऑफिस', N'Real Estate Office', N'S', NULL, NULL, NULL, N'', 0),
  (808, N'रिअल इस्टेट कन्सल्टन्सी', N'Real Estate Consultancy', N'S', NULL, NULL, NULL, N'', 0),
  (809, N'रिपेअरिंग शॉप', N'Repair Shop', N'S', NULL, NULL, NULL, N'', 0),
  (810, N'रिपेअरिंग स्टोर', N'Repair Store', N'S', NULL, NULL, NULL, N'', 0),
  (811, N'रिपेअरिंग सर्विसेस', N'Repair Services', N'S', NULL, NULL, NULL, N'', 0),
  (812, N'रिपेअरींग वर्क', N'Repair Work', N'S', NULL, NULL, NULL, N'', 0),
  (813, N'रिपेअरींग शॉप', N'Repair Shop', N'S', NULL, NULL, NULL, N'', 0),
  (814, N'रिपेरिंग सेंटर ', N'Repair Center', N'S', NULL, NULL, NULL, N'', 0),
  (815, N'रियल इस्टेट ', N'Real Estate', N'S', NULL, NULL, NULL, N'', 0),
  (816, N'रियल इस्टेट ऑफिस', N'Real Estate Office', N'S', NULL, NULL, NULL, N'', 0),
  (817, N'रियल इस्टेट कार्यालय  ', N'Real Estate Office', N'S', NULL, NULL, NULL, N'', 0),
  (818, N'रियल इस्टेस्ट', N'Real Estate', N'S', NULL, NULL, NULL, N'', 0),
  (819, N'रियल ईस्टेट ऑफिस', N'Real Estate Office', N'S', NULL, NULL, NULL, N'', 0),
  (820, N'रिलायन्स मार्ट ', N'Reliance Mart', N'S', NULL, NULL, NULL, N'', 0),
  (821, N'रीअल  इस्टेट', N'Real Estate', N'S', NULL, NULL, NULL, N'', 0),
  (822, N'रीअल  इस्टेट ऑफिस', N'Real Estate Office', N'S', NULL, NULL, NULL, N'', 0),
  (823, N'रीअल इस्टेट ऑफिस', N'Real Estate Office', N'S', NULL, NULL, NULL, N'', 0),
  (824, N'रीपेरिंग अँड सर्विसेस ', N'Repairing and Services', N'S', NULL, NULL, NULL, N'', 0),
  (825, N'रीपेरिंग प्रॉपर्टी ऑफिस', N'Repairing Property Office', N'S', NULL, NULL, NULL, N'', 0),
  (826, N'रीपेरिंग सेंटर', N'Repair Center', N'S', NULL, NULL, NULL, N'', 0),
  (827, N'रीयल इस्टेट', N'Real Estate', N'S', NULL, NULL, NULL, N'', 0),
  (828, N'रीयल इस्टेट ऑफिस', N'Real Estate Office', N'S', NULL, NULL, NULL, N'', 0),
  (829, N'लँड अँड बिल्डिंग प्लॅनिंग ', N'Land Building Planning', N'S', NULL, NULL, NULL, N'', 0),
  (830, N'लेडिज इमिटेशन ज्वेलरी', N'Ladies Imitation Jewellery', N'S', NULL, NULL, NULL, N'', 0),
  (831, N'लेडिज गारमेंट', N'Ladies Garments', N'S', NULL, NULL, NULL, N'', 0),
  (832, N'लेडिज टेलर', N'Ladies Tailor', N'S', NULL, NULL, NULL, N'', 0),
  (833, N'लेडिज टेलर अँड ब्युटी पार्लर', N'Ladies Tailor and Beauty Parlour', N'S', NULL, NULL, NULL, N'', 0),
  (834, N'लेडिज टेलर शॉप', N'Ladies Tailor Shop', N'S', NULL, NULL, NULL, N'', 0),
  (835, N'लेडिज पार्लर', N'Ladies Parlour', N'S', NULL, NULL, NULL, N'', 0),
  (836, N'लेडिज ब्युटिक', N'Ladies Boutique', N'S', NULL, NULL, NULL, N'', 0),
  (837, N'लेडिज वेअर', N'Ladies Wear', N'S', NULL, NULL, NULL, N'', 0),
  (838, N'लेडिज वेयर अँड कॉस्मेटिक', N'Ladies Wear and Cosmetics', N'S', NULL, NULL, NULL, N'', 0),
  (839, N'लेडिज सलून', N'Ladies Salon', N'S', NULL, NULL, NULL, N'', 0),
  (840, N'लेडीज टेलर', N'Ladies Tailor', N'S', NULL, NULL, NULL, N'', 0),
  (841, N'लेडीज बुटीक', N'Ladies Boutique', N'S', NULL, NULL, NULL, N'', 0),
  (842, N'लेडीज ब्युटि कलेक्शन ', N'Ladies Beauty Collection', N'S', NULL, NULL, NULL, N'', 0),
  (843, N'लेडीज ब्युटि पार्लर', N'Ladies Beauty Parlour', N'S', NULL, NULL, NULL, N'', 0),
  (844, N'लेडीज सलून', N'Ladies Salon', N'S', NULL, NULL, NULL, N'', 0),
  (845, N'लेडीस कॉस्मेटिक्स', N'Ladies Cosmetics', N'S', NULL, NULL, NULL, N'', 0),
  (846, N'लेडीस कोसमेटिक्स', N'Ladies Cosmetics', N'S', NULL, NULL, NULL, N'', 0),
  (847, N'लेडीस टेलर', N'Ladies Tailor', N'S', NULL, NULL, NULL, N'', 0),
  (848, N'लेडीस पार्लर ', N'Ladies Parlour', N'S', NULL, NULL, NULL, N'', 0),
  (849, N'लॅपटॉप सेल्स अँड सर्विसेस', N'Laptop Sales and Services', N'S', NULL, NULL, NULL, N'', 0),
  (850, N'लॅब', N'Lab', N'S', NULL, NULL, NULL, N'', 0),
  (851, N'लॅब मेडिकल', N'Lab Medical', N'S', NULL, NULL, NULL, N'', 0),
  (852, N'लॅबोरेटरी', N'Laboratory', N'S', NULL, NULL, NULL, N'', 0),
  (853, N'ॲल्युमिनियम अंड क्लास वर्क', N'Aluminium and Glass Work', N'S', NULL, NULL, NULL, N'', 0),
  (854, N'ॲल्युमिनियम फॅब्रिक', N'Aluminium Fabrication', N'S', NULL, NULL, NULL, N'', 0),
  (855, N'लहान मुलांचा दवाखाना', N'Children Clinic', N'S', NULL, NULL, NULL, N'', 0),
  (856, N'लहान मुलांची शाळा', N'Children''s School', N'S', NULL, NULL, NULL, N'', 0),
  (857, N'लाईट हाऊस', N'Light House', N'S', NULL, NULL, NULL, N'', 0),
  (858, N'लाईफ इन्शुरन्स', N'Life Insurance', N'S', NULL, NULL, NULL, N'', 0),
  (859, N'लाईफ़ इंन्शुरन्स', N'Life Insurance', N'S', NULL, NULL, NULL, N'', 0),
  (860, N'लाँड्री', N'Laundry', N'S', NULL, NULL, NULL, N'', 0),
  (861, N'लादी विक्री', N'Tile Sales', N'S', NULL, NULL, NULL, N'', 0),
  (862, N'लादीचे गोडाउन ', N'Tile Godown', N'S', NULL, NULL, NULL, N'', 0),
  (863, N'लायटिंग शॉप', N'Lighting Shop', N'S', NULL, NULL, NULL, N'', 0),
  (864, N'लिफ्टर्स ऑफिस ', N'Lift Service Office', N'S', NULL, NULL, NULL, N'', 0),
  (866, N'लॉजिस्टिक्स', N'Logistics', N'S', NULL, NULL, NULL, N'', 0),
  (867, N'लॉजीस्टीक ऑफिस', N'Logistics Office', N'S', NULL, NULL, NULL, N'', 0),
  (868, N'लॉटरी', N'Lottery', N'S', NULL, NULL, NULL, N'', 0),
  (869, N'लॉंड्रि', N'Laundry', N'S', NULL, NULL, NULL, N'', 0),
  (870, N'लॉड्री', N'Laundry', N'S', NULL, NULL, NULL, N'', 0),
  (871, N'लॉंड्री', N'Laundry', N'S', NULL, NULL, NULL, N'', 0),
  (872, N'लॉंड्री वर्क्स', N'Laundry Works', N'S', NULL, NULL, NULL, N'', 0),
  (873, N'लॉंड्री शॉप', N'Laundry Shop', N'S', NULL, NULL, NULL, N'', 0),
  (874, N'लॉन्ड्रि', N'Laundry', N'S', NULL, NULL, NULL, N'', 0),
  (875, N'लॉंन्ड्रि', N'Laundry', N'S', NULL, NULL, NULL, N'', 0),
  (876, N'लॉंन्ड्रि दुकान', N'Laundry Shop', N'S', NULL, NULL, NULL, N'', 0),
  (877, N'लॉन्ड्री', N'Laundry', N'S', NULL, NULL, NULL, N'', 0),
  (878, N'लॉंन्ड्री', N'Laundry', N'S', NULL, NULL, NULL, N'', 0),
  (879, N'लॉन्ड्री शॉप', N'Laundry Shop', N'S', NULL, NULL, NULL, N'', 0),
  (880, N'लॉंन्ड्री शॉप', N'Laundry Shop', N'S', NULL, NULL, NULL, N'', 0),
  (881, N'लोंड्री', N'Laundry', N'S', NULL, NULL, NULL, N'', 0),
  (882, N'लोण ऑफिस', N'Loan Office', N'S', NULL, NULL, NULL, N'', 0),
  (883, N'लोण्ड्री', N'Laundry', N'S', NULL, NULL, NULL, N'', 0),
  (884, N'लोन फायनान्स', N'Loan Finance', N'S', NULL, NULL, NULL, N'', 0),
  (885, N'लोन सेर्विसेस', N'Loan Services', N'S', NULL, NULL, NULL, N'', 0),
  (886, N'लौंड्रि', N'Laundry', N'S', NULL, NULL, NULL, N'', 0),
  (887, N'वकिल', N'Lawyer', N'S', NULL, NULL, NULL, N'', 0),
  (888, N'वजन काटा ', N'Weighing Scale', N'S', NULL, NULL, NULL, N'', 0),
  (889, N'वजनकाटा', N'Weighing Scale', N'S', NULL, NULL, NULL, N'', 0),
  (890, N'वूड इम्प्रेशन', N'Wood Impression', N'S', NULL, NULL, NULL, N'', 0),
  (891, N'मंगल कार्यालय', N'Marriage Hall', N'S', NULL, NULL, NULL, N'', 0),
  (892, N'ॲमेझोन पार्सल गोडाउन ', N'Amazon Parcel Godown', N'S', NULL, NULL, NULL, N'', 0),
  (893, N'मटण शॉप', N'Mutton Shop', N'S', NULL, NULL, NULL, N'', 0),
  (894, N'मंडप', N'Mandap', N'S', NULL, NULL, NULL, N'', 0),
  (895, N'मंडप डेकोरेटर्स', N'Mandap Decorators', N'S', NULL, NULL, NULL, N'', 0),
  (896, N'मंडप डेकोरेशन गोडाउन ', N'Mandap Decoration Godown', N'S', NULL, NULL, NULL, N'', 0),
  (897, N'मंडप दुकान', N'Mandap Shop', N'S', NULL, NULL, NULL, N'', 0),
  (898, N'मेडिकल', N'Medical', N'S', NULL, NULL, NULL, N'', 0),
  (899, N'मेडिकल अँड जनरल स्टोअर', N'Medical and General Store', N'S', NULL, NULL, NULL, N'', 0),
  (900, N'मेडिकल अँड जनरल स्टोर', N'Medical and General Store', N'S', NULL, NULL, NULL, N'', 0),
  (901, N'मेडिकल डिस्ट्रिबुटर', N'Medical Distributor', N'S', NULL, NULL, NULL, N'', 0),
  (902, N'मेडिकल परवाना बनवणे', N'Medical Licence Services', N'S', NULL, NULL, NULL, N'', 0),
  (903, N'मेडिकल स्टोअर', N'Medical Store', N'S', NULL, NULL, NULL, N'', 0),
  (904, N'मेडिकल स्टोअर्स', N'Medical Stores', N'S', NULL, NULL, NULL, N'', 0),
  (905, N'मेडिकल्स', N'Medical Store', N'S', NULL, NULL, NULL, N'', 0),
  (906, N'मेडिसिन औषधे ', N'Medicine Medicines', N'S', NULL, NULL, NULL, N'', 0),
  (907, N'मेडिसिन डीस्ट्रीब्युटर', N'Medicine Distributor', N'S', NULL, NULL, NULL, N'', 0),
  (908, N'मेडिसिन स्टोअर', N'Medicine Store', N'S', NULL, NULL, NULL, N'', 0),
  (909, N'मेडिसीन', N'Medicine', N'S', NULL, NULL, NULL, N'', 0),
  (910, N'मेडिसीन स्टॉकिस्ट', N'Medicine Stockist', N'S', NULL, NULL, NULL, N'', 0),
  (911, N'मेडीकल', N'Medical Store', N'S', NULL, NULL, NULL, N'', 0),
  (912, N'मुथुट फिनकॉर्प', N'Muthoot Fincorp', N'S', NULL, NULL, NULL, N'', 0),
  (913, N'मद्य विक्री', N'Liquor Sales', N'S', NULL, NULL, NULL, N'', 0),
  (914, N'मदयविक्री', N'Liquor Sales', N'S', NULL, NULL, NULL, N'', 0),
  (915, N'मद्यविक्री ', N'Liquor Sales', N'S', NULL, NULL, NULL, N'', 0),
  (916, N'मेन्स पार्लर', N'Mens Parlour', N'S', NULL, NULL, NULL, N'', 0),
  (917, N'मेन्स वेअर', N'Mens Wear', N'S', NULL, NULL, NULL, N'', 0),
  (918, N'मेन्स सलून', N'Mens Salon', N'S', NULL, NULL, NULL, N'', 0),
  (919, N'मनी ट्रान्सफर', N'Money Transfer', N'S', NULL, NULL, NULL, N'', 0),
  (920, N'म्यूचुअल फंड', N'Mutual Fund', N'S', NULL, NULL, NULL, N'', 0),
  (921, N'म्यूजिक क्लासेस', N'Music Classes', N'S', NULL, NULL, NULL, N'', 0),
  (922, N'म्युझिक स्टुडिओ', N'Music Studio', N'S', NULL, NULL, NULL, N'', 0),
  (923, N'म्यानीफ्याक्चरिंग  लाइट', N'Light Manufacturing', N'S', NULL, NULL, NULL, N'', 0),
  (924, N'मर्केटिंग ऑफ इंजिनिअरिंग प्रोड्क्ट', N'Marketing of Engineering Products', N'S', NULL, NULL, NULL, N'', 0),
  (925, N'मशीन पार्ट ', N'Machine Parts', N'S', NULL, NULL, NULL, N'', 0),
  (926, N'मस्य व्यवसाय', N'Fishing Business', N'S', NULL, NULL, NULL, N'', 0),
  (927, N'मसाला दुकान ', N'Spice Shop', N'S', NULL, NULL, NULL, N'', 0),
  (928, N'मार्केट', N'Market', N'S', NULL, NULL, NULL, N'', 0),
  (929, N'मार्केटिंग ऑफिस', N'Marketing Office', N'S', NULL, NULL, NULL, N'', 0),
  (930, N'मासे विक्री', N'Fish Sales', N'S', NULL, NULL, NULL, N'', 0),
  (931, N'मासे विक्री , खाद्य विक्री', N'Fish Sales, Food Sales', N'S', NULL, NULL, NULL, N'', 0),
  (932, N'बिल्डर अँड कन्स्ट्रकशन', N'Builder and Construction', N'S', NULL, NULL, NULL, N'', 0),
  (933, N'बिल्डर इंटेरियर वर्क्स', N'Builder Interior Works', N'S', NULL, NULL, NULL, N'', 0),
  (934, N'बिल्डर ऑफिस', N'Builder Office', N'S', NULL, NULL, NULL, N'', 0),
  (935, N'बिल्डर कार्यालय', N'Builder Office', N'S', NULL, NULL, NULL, N'', 0),
  (936, N'बिल्डर डेव्हलपर ऑफिस', N'Builder Developer Office', N'S', NULL, NULL, NULL, N'', 0),
  (937, N'बिल्डर मटेरियल ऑफिस', N'Builder Material Office', N'S', NULL, NULL, NULL, N'', 0),
  (938, N'बिल्डरर्स अँड डेव्हलपर्स ', N'Builders and Developers', N'S', NULL, NULL, NULL, N'', 0),
  (939, N'बिल्डर्स अँड डेवलपर्स ऑफिस', N'Builders and Developers Office', N'S', NULL, NULL, NULL, N'', 0),
  (940, N'बिल्डर्स अँड डेव्हपर्स', N'Builders and Developers', N'S', NULL, NULL, NULL, N'', 0),
  (941, N'बिल्डर्स अँड डेव्हलपर्स', N'Builders and Developers', N'S', NULL, NULL, NULL, N'', 0),
  (942, N'बिल्डर्स अँन्ड डेवलपर ऑफिस', N'Builders and Developer Office', N'S', NULL, NULL, NULL, N'', 0),
  (943, N'बिल्डर्स आणि डेवलपर्स ', N'Builders and Developers', N'S', NULL, NULL, NULL, N'', 0),
  (944, N'बिलडर्स ऑफिस', N'Builders Office', N'S', NULL, NULL, NULL, N'', 0),
  (945, N'बिल्डर्स ऑफिस', N'Builders Office', N'S', NULL, NULL, NULL, N'', 0),
  (946, N'बिल्डर्स कार्यालय', N'Builders Office', N'S', NULL, NULL, NULL, N'', 0),
  (947, N'बिल्डिंग मटेरियल', N'Building Material', N'S', NULL, NULL, NULL, N'', 0),
  (948, N'बॉडी मसाज', N'Body Massage', N'S', NULL, NULL, NULL, N'', 0),
  (949, N'भंगार ', N'Scrap', N'S', NULL, NULL, NULL, N'', 0),
  (950, N'भंगार दुकान', N'Scrap Shop', N'S', NULL, NULL, NULL, N'', 0),
  (951, N'भंगार रद्दीचे दुकान', N'Scrap and Waste Paper Shop', N'S', NULL, NULL, NULL, N'', 0),
  (952, N'भंगार शॉप', N'Scrap Shop', N'S', NULL, NULL, NULL, N'', 0),
  (953, N'भंगारचे दुकान ', N'Scrap Shop', N'S', NULL, NULL, NULL, N'', 0),
  (954, N'ब्लड कनेक्शन सेंटर', N'Blood Collection Center', N'S', NULL, NULL, NULL, N'', 0),
  (955, N'ब्लड लेबोरेटरी', N'Blood Laboratory', N'S', NULL, NULL, NULL, N'', 0),
  (956, N'ब्लड लेबोरेटरीज', N'Blood Laboratories', N'S', NULL, NULL, NULL, N'', 0),
  (957, N'बाइक कार विक्री', N'Bike and Car Sales', N'S', NULL, NULL, NULL, N'', 0),
  (958, N'बाइक गॅरेज', N'Bike Garage', N'S', NULL, NULL, NULL, N'', 0),
  (959, N'बाइक सर्विस सेंटर', N'Bike Service Center', N'S', NULL, NULL, NULL, N'', 0),
  (960, N'बाइक सेल्स ', N'Bike Sales', N'S', NULL, NULL, NULL, N'', 0),
  (961, N'बाइक सारविर्स सेंटर', N'Bike Service Center', N'S', NULL, NULL, NULL, N'', 0),
  (962, N'बाईक विकतात', N'Bike Sales', N'S', NULL, NULL, NULL, N'', 0),
  (963, N'बाटल्यांचा गोडाउन', N'Bottle Godown', N'S', NULL, NULL, NULL, N'', 0),
  (964, N'बांधकाम व्यवसाय', N'Construction Business', N'S', NULL, NULL, NULL, N'', 0),
  (965, N'फ्रूट शॉप', N'Fruit Shop', N'S', NULL, NULL, NULL, N'', 0),
  (966, N'फ्रूट सेंटर', N'Fruit Center', N'S', NULL, NULL, NULL, N'', 0),
  (967, N'फर्नेशिंग', N'Furnishing', N'S', NULL, NULL, NULL, N'', 0),
  (968, N'फर्निचर', N'Furniture', N'S', NULL, NULL, NULL, N'', 0),
  (969, N'फर्निचर दुकान', N'Furniture Shop', N'S', NULL, NULL, NULL, N'', 0),
  (970, N'फर्निचर पॉलिश ', N'Furniture Polish', N'S', NULL, NULL, NULL, N'', 0),
  (971, N'फर्निचर मेकिंग', N'Furniture Making', N'S', NULL, NULL, NULL, N'', 0),
  (972, N'फर्निचर मेकिंग शॉप', N'Furniture Making Shop', N'S', NULL, NULL, NULL, N'', 0),
  (973, N'फर्निचर वर्क', N'Furniture Work', N'S', NULL, NULL, NULL, N'', 0),
  (974, N'फर्निचर शॉप', N'Furniture Shop', N'S', NULL, NULL, NULL, N'', 0),
  (975, N'वेफर शॉप', N'Wafer Shop', N'S', NULL, NULL, NULL, N'', 0),
  (977, N'वेल्डिंग दुकान', N'Welding Shop', N'S', NULL, NULL, NULL, N'', 0),
  (978, N'वेल्डिंग वर्क शॉप ', N'Welding Workshop', N'S', NULL, NULL, NULL, N'', 0),
  (979, N'वेल्डिंग वर्कशॉप', N'Welding Workshop', N'S', NULL, NULL, NULL, N'', 0),
  (980, N'वेल्डिंग शॉप ', N'Welding Shop', N'S', NULL, NULL, NULL, N'', 0),
  (981, N'वस्तूभंडार', N'General Store', N'S', NULL, NULL, NULL, N'', 0),
  (982, N'व्हेजिटेबल व शॉप', N'Vegetable Shop', N'S', NULL, NULL, NULL, N'', 0),
  (983, N'व्हेजीटेबल ', N'Vegetable', N'S', NULL, NULL, NULL, N'', 0),
  (984, N'व्हेजीटेबल शॉप', N'Vegetable Shop', N'S', NULL, NULL, NULL, N'', 0),
  (985, N'वित्तीय सेवा', N'Financial Services', N'S', NULL, NULL, NULL, N'', 0),
  (986, N'वित्तीय संस्था', N'Financial Institution', N'S', NULL, NULL, NULL, N'', 0),
  (987, N'वित्तीय संस्था आणि सेवा', N'Financial Institution and Services', N'S', NULL, NULL, NULL, N'', 0),
  (988, N'विद्युत विक्री', N'Electrical Sales', N'S', NULL, NULL, NULL, N'', 0),
  (989, N'वॉच सेंटर', N'Watch Center', N'S', NULL, NULL, NULL, N'', 0),
  (990, N'वॉटर टॅंक सप्लायर', N'Water Tank Supplier', N'S', NULL, NULL, NULL, N'', 0),
  (991, N'वॉटर प्यूरिफायर', N'Water Purifier', N'S', NULL, NULL, NULL, N'', 0),
  (992, N'वॉटर सप्लायर्स', N'Water Suppliers', N'S', NULL, NULL, NULL, N'', 0),
  (993, N'वॉलपेपर विक्रेता ', N'Wallpaper Seller', N'S', NULL, NULL, NULL, N'', 0),
  (994, N'वॉलपेपर शॉप', N'Wallpaper Shop', N'S', NULL, NULL, NULL, N'', 0),
  (995, N'वॉलपेपर स्टोअर ', N'Wallpaper Store', N'S', NULL, NULL, NULL, N'', 0),
  (996, N'वॉशिंग', N'Washing', N'S', NULL, NULL, NULL, N'', 0),
  (997, N'शुज विक्री', N'Shoes Sales', N'S', NULL, NULL, NULL, N'', 0),
  (999, N'शिक्षण कार्यालय', N'Education Office', N'S', NULL, NULL, NULL, N'', 0),
  (1000, N'शिलाई मशीन', N'Sewing Machine', N'S', NULL, NULL, NULL, N'', 0),
  (1001, N'शिलाई मशीन रीपेरिंग अँड सेलिंग', N'Sewing Machine Repair and Sales', N'S', NULL, NULL, NULL, N'', 0),
  (1002, N'शीप ब्रोकर्स', N'Sheep Brokers', N'S', NULL, NULL, NULL, N'', 0),
  (1003, N'शोरूम', N'Showroom', N'S', NULL, NULL, NULL, N'', 0),
  (1004, N'शोर्मा शॉप ', N'Shawarma Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1005, N'सेकंड हँड लॅपटॉप अॅन्ड कम्प्युटर सेल्स अँन्ड रिपेअरिंग', N'Second Hand Laptop and Computer Sales and Repair', N'S', NULL, NULL, NULL, N'', 0),
  (1006, N'सेक्युरिटी प्रोव्हायडर ऑफिस', N'Security Provider Office', N'S', NULL, NULL, NULL, N'', 0),
  (1007, N'स्क्रॅप गोडाउन', N'Scrap Godown', N'S', NULL, NULL, NULL, N'', 0),
  (1008, N'स्क्रॅप माल', N'Scrap Material', N'S', NULL, NULL, NULL, N'', 0),
  (1009, N'स्कीन केअर', N'Skin Care', N'S', NULL, NULL, NULL, N'', 0),
  (1010, N'स्कीन स्पेशालीस्ट', N'Skin Specialist', N'S', NULL, NULL, NULL, N'', 0),
  (1011, N'स्कीन हेयर', N'Skin and Hair', N'S', NULL, NULL, NULL, N'', 0),
  (1012, N'संगणक दुरूस्ती', N'Computer Repair', N'S', NULL, NULL, NULL, N'', 0),
  (1013, N'स्टॅम्प वेंडर', N'Stamp Vendor', N'S', NULL, NULL, NULL, N'', 0),
  (1014, N'स्टेशनरि', N'Stationery', N'S', NULL, NULL, NULL, N'', 0),
  (1015, N'स्टेशनरी', N'Stationery', N'S', NULL, NULL, NULL, N'', 0),
  (1016, N'स्टेशनरी अँड गिफ्ट सेंटर', N'Stationery and Gift Center', N'S', NULL, NULL, NULL, N'', 0),
  (1017, N'स्टेशनरी अँड झेरॉक्स', N'Stationery and Xerox', N'S', NULL, NULL, NULL, N'', 0),
  (1018, N'स्टेशनरी अँड झेरॉक्स शॉप', N'Stationery and Xerox Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1019, N'स्टेशनरी अँड झेरॉक्स सेंटर', N'Stationery and Xerox Center', N'S', NULL, NULL, NULL, N'', 0),
  (1020, N'स्टेशनरी अँड नॉव्हेल्टी', N'Stationery and Novelty', N'S', NULL, NULL, NULL, N'', 0),
  (1021, N'स्टेशनरी अंड प्रिंटिंग', N'Stationery and Printing', N'S', NULL, NULL, NULL, N'', 0),
  (1022, N'स्टेशनरी आणि झेरॉक्स', N'Stationery and Xerox', N'S', NULL, NULL, NULL, N'', 0),
  (1023, N'स्टेशनरी दुकान', N'Stationery Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1024, N'स्टेशनरी व कोस्म्याटिक', N'Stationery and Cosmetics', N'S', NULL, NULL, NULL, N'', 0),
  (1025, N'स्टेशनरी शॉप', N'Stationery Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1026, N'स्टार बिल्डर ऑफिस', N'Star Builder Office', N'S', NULL, NULL, NULL, N'', 0),
  (1027, N'स्टिल ट्रेडर', N'Steel Trader', N'S', NULL, NULL, NULL, N'', 0),
  (1028, N'स्टिल पाइप गोडाउन ', N'Steel Pipe Godown', N'S', NULL, NULL, NULL, N'', 0),
  (1029, N'स्टील मार्केट', N'Steel Market', N'S', NULL, NULL, NULL, N'', 0),
  (1030, N'स्टील शॉप', N'Steel Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1031, N'स्टील सेंटर', N'Steel Center', N'S', NULL, NULL, NULL, N'', 0),
  (1032, N'स्टॉक ब्रोकिंग', N'Stock Broking', N'S', NULL, NULL, NULL, N'', 0),
  (1033, N'स्टॉक होल्डिंग', N'Stock Holding', N'S', NULL, NULL, NULL, N'', 0),
  (1034, N'स्टॉकिस्ट', N'Stockist', N'S', NULL, NULL, NULL, N'', 0),
  (1036, N'स्टोअर्स रूम ', N'Stores Room', N'S', NULL, NULL, NULL, N'', 0),
  (1037, N'मीट स्टोरेज', N'Meat Storage', N'S', NULL, NULL, NULL, N'', 0),
  (1038, N'मॉड्युलरकिचन ट्रॉलीज', N'Modular Kitchen Trolleys', N'S', NULL, NULL, NULL, N'', 0),
  (1039, N'मॉल', N'Mall', N'S', NULL, NULL, NULL, N'', 0),
  (1040, N'मोटर ट्रेनिंग', N'Motor Training', N'S', NULL, NULL, NULL, N'', 0),
  (1041, N'मोटर ट्रेनिंग स्कूल', N'Motor Training School', N'S', NULL, NULL, NULL, N'', 0),
  (1042, N'मोटर पंप', N'Motor Pump', N'S', NULL, NULL, NULL, N'', 0),
  (1043, N'मोडूलर किचन', N'Modular Kitchen', N'S', NULL, NULL, NULL, N'', 0),
  (1044, N'मोबाइल अँड झेरॉक्स सेंटर ', N'Mobile and Xerox Center', N'S', NULL, NULL, NULL, N'', 0),
  (1045, N'मोबाइल आणि कम्प्युटर रिपेअरींग', N'Mobile and Computer Repair', N'S', NULL, NULL, NULL, N'', 0),
  (1046, N'मोबाइल एक्सेसरीज', N'Mobile Accessories', N'S', NULL, NULL, NULL, N'', 0),
  (1047, N'मोबाइल एस्केसरीज', N'Mobile Accessories', N'S', NULL, NULL, NULL, N'', 0),
  (1048, N'मोबाइल गॅलरी', N'Mobile Gallery', N'S', NULL, NULL, NULL, N'', 0),
  (1049, N'मोबाइल डीस्ट्रीब्युटर', N'Mobile Distributor', N'S', NULL, NULL, NULL, N'', 0),
  (1050, N'मोबाइल रीपेरिंग', N'Mobile Repair', N'S', NULL, NULL, NULL, N'', 0),
  (1051, N'मोबाइल शॉप', N'Mobile Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1052, N'मोबाइल शॉप , कपड्याचे दुकान', N'Mobile Shop and Clothing Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1053, N'मोबाइल/लॅपटॉप रिपेअरींग', N'Mobile / Laptop Repair', N'S', NULL, NULL, NULL, N'', 0),
  (1054, N'मोबाईल रिपेरिंग', N'Mobile Repair', N'S', NULL, NULL, NULL, N'', 0),
  (1055, N'मोबाईल रीपेअरिंग शॉप', N'Mobile Repair Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1056, N'मोबाईल शॉप', N'Mobile Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1057, N'मोबाईल सेंटर', N'Mobile Center', N'S', NULL, NULL, NULL, N'', 0),
  (1058, N'युनिफॉर्म', N'Uniform Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1059, N'युनिसेक्स सलून', N'Unisex Salon', N'S', NULL, NULL, NULL, N'', 0),
  (1060, N'रेकॉर्डिंग स्टुडिओ ', N'Recording Studio', N'S', NULL, NULL, NULL, N'', 0),
  (1061, N'रेडिमेट गारमेंट्स', N'Readymade Garments', N'S', NULL, NULL, NULL, N'', 0),
  (1062, N'रेडियम आर्ट्स ', N'Radium Arts', N'S', NULL, NULL, NULL, N'', 0),
  (1063, N'रद्दी दुकान', N'Waste Paper Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1064, N'रद्दी पेपर ', N'Waste Paper', N'S', NULL, NULL, NULL, N'', 0),
  (1065, N'रद्दी पेपर मार्ट', N'Waste Paper Mart', N'S', NULL, NULL, NULL, N'', 0),
  (1066, N'रेपारींग सेंटर', N'Repair Center', N'S', NULL, NULL, NULL, N'', 0),
  (1067, N'रबर स्टॅम्प वेंडर ', N'Rubber Stamp Vendor', N'S', NULL, NULL, NULL, N'', 0),
  (1068, N'सनग्लास', N'Sunglasses Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1069, N'सनराइज् रियलटोर्स', N'Sunrise Realtors', N'S', NULL, NULL, NULL, N'', 0),
  (1070, N'स्पेअर पार्ट', N'Spare Part', N'S', NULL, NULL, NULL, N'', 0),
  (1071, N'स्पेअर पार्ट ऑफिस', N'Spare Parts Office', N'S', NULL, NULL, NULL, N'', 0),
  (1072, N'स्पेअर पार्ट व गॅरेज ', N'Spare Parts and Garage', N'S', NULL, NULL, NULL, N'', 0),
  (1073, N'स्पेअर पार्ट्स', N'Spare Parts', N'S', NULL, NULL, NULL, N'', 0),
  (1074, N'स्पेअरपार्ट शॉप ', N'Spare Parts Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1075, N'स्पेयर पार्ट', N'Spare Part', N'S', NULL, NULL, NULL, N'', 0),
  (1076, N'स्पेयर पार्ट शॉप', N'Spare Parts Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1077, N'सुपर मार्केट ', N'Super Market', N'S', NULL, NULL, NULL, N'', 0),
  (1078, N'स्प्लेसमेंट ऑफिस', N'Placement Office', N'S', NULL, NULL, NULL, N'', 0),
  (1079, N'सप्लाय चेन ऑफिस', N'Supply Chain Office', N'S', NULL, NULL, NULL, N'', 0),
  (1080, N'स्पा', N'Spa', N'S', NULL, NULL, NULL, N'', 0),
  (1081, N'स्पा आणि मसाज सेंटर', N'Spa and Massage Center', N'S', NULL, NULL, NULL, N'', 0),
  (1082, N'स्पा सेंटर', N'Spa Center', N'S', NULL, NULL, NULL, N'', 0),
  (1083, N'स्पा. सेंटर', N'Spa Center', N'S', NULL, NULL, NULL, N'', 0),
  (1084, N'स्पोर्ट शॉप', N'Sports Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1085, N'स्पोर्ट्स आणि जिम उपयोगीवस्तु', N'Sports and Gym Equipment', N'S', NULL, NULL, NULL, N'', 0),
  (1086, N'स्पोर्ट्स शॉप', N'Sports Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1087, N'सफ़ायर शॉप(कपडा )', N'Sapphire Shop (Clothing)', N'S', NULL, NULL, NULL, N'', 0),
  (1088, N'सुरक्षा ', N'Security', N'S', NULL, NULL, NULL, N'', 0),
  (1089, N'सर्जिकल शॉप', N'Surgical Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1090, N'सर्वेअर ऑफिस ', N'Surveyor Office', N'S', NULL, NULL, NULL, N'', 0),
  (1091, N'सर्विस प्रोवायडर', N'Service Provider', N'S', NULL, NULL, NULL, N'', 0),
  (1092, N'सर्विस सेंटर ', N'Service Center', N'S', NULL, NULL, NULL, N'', 0),
  (1093, N'सलुन', N'Salon', N'S', NULL, NULL, NULL, N'', 0),
  (1094, N'सलून', N'Salon', N'S', NULL, NULL, NULL, N'', 0),
  (1095, N'सलून शॉप', N'Salon Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1096, N'स्लयडिंग विंडोव अँड डोअर', N'Sliding Window and Door', N'S', NULL, NULL, NULL, N'', 0),
  (1097, N'सेल्स अँड सर्विसेस ', N'Sales and Services', N'S', NULL, NULL, NULL, N'', 0),
  (1098, N'सेल्स कार्यालय बिल्डर', N'Sales Office Builder', N'S', NULL, NULL, NULL, N'', 0),
  (1099, N'सेल्स सर्विसेस', N'Sales Services', N'S', NULL, NULL, NULL, N'', 0),
  (1100, N'सेल्स(स्पोर्ट शॉप)', N'Sales(Sports Shop)', N'S', NULL, NULL, NULL, N'', 0),
  (1101, N'स्लाइडिग', N'Sliding Work', N'S', NULL, NULL, NULL, N'', 0),
  (1102, N'सहेली', N'Saheli', N'S', NULL, NULL, NULL, N'', 0),
  (1103, N'साईन बोर्ड मेकिंग', N'Sign Board Making', N'S', NULL, NULL, NULL, N'', 0),
  (1104, N'साडी सेंटर ', N'Saree Center', N'S', NULL, NULL, NULL, N'', 0),
  (1105, N'सायकल मार्ट ', N'Cycle Mart', N'S', NULL, NULL, NULL, N'', 0),
  (1106, N'सायकल रिपेअरिंग', N'Cycle Repairing', N'S', NULL, NULL, NULL, N'', 0),
  (1107, N'सायकल रीपेरिंग शॉप', N'Cycle Repairing Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1108, N'सायकल शॉप ', N'Cycle Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1109, N'सायकल स्टोअर', N'Cycle Store', N'S', NULL, NULL, NULL, N'', 0),
  (1110, N'सायबर कॅफे', N'Cyber Cafe', N'S', NULL, NULL, NULL, N'', 0),
  (1111, N'सिक्युरिटी ऑफिस', N'Security Office', N'S', NULL, NULL, NULL, N'', 0),
  (1112, N'सिक्युरिटी सर्विसेस', N'Security Services', N'S', NULL, NULL, NULL, N'', 0),
  (1113, N'सिंगार शॉप', N'Cosmetics Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1114, N'सिटी कव्हर /सोफा मेकिंग', N'Seat Cover / Sofa Making', N'S', NULL, NULL, NULL, N'', 0),
  (1115, N'सिटी मेकर शॉप ', N'Seat Maker Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1116, N'सिमेंटचे गोडाउन ', N'Cement Godown', N'S', NULL, NULL, NULL, N'', 0),
  (1117, N'सिरॅमिक', N'Ceramic', N'S', NULL, NULL, NULL, N'', 0),
  (1118, N'सिरॅमिक अँड स्टाईल', N'Ceramic and Tiles', N'S', NULL, NULL, NULL, N'', 0),
  (1119, N'सिरॅमिक शॉप', N'Ceramic Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1120, N'सिरॅमिक्स शॉप', N'Ceramics Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1121, N'सिरामिक्स', N'Ceramics', N'S', NULL, NULL, NULL, N'', 0),
  (1122, N'सिरामिक्स गोडाउन ', N'Ceramics Godown', N'S', NULL, NULL, NULL, N'', 0),
  (1123, N'सिव्हिल कॉन्ट्रॅक्टर', N'Civil Contractor', N'S', NULL, NULL, NULL, N'', 0),
  (1124, N'भाजी फळ विक्री', N'Vegetable and Fruit Sales', N'S', NULL, NULL, NULL, N'', 0),
  (1125, N'भाजी व किराणा', N'Vegetable and Grocery', N'S', NULL, NULL, NULL, N'', 0),
  (1126, N'भाजी व फळांचे दुकान', N'Vegetable and Fruit Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1127, N'भाजी विक्रेता', N'Vegetable Seller', N'S', NULL, NULL, NULL, N'', 0),
  (1128, N'भाजी विक्री', N'Vegetable Sales', N'S', NULL, NULL, NULL, N'', 0),
  (1129, N'भाजी सेंटर', N'Vegetable Center', N'S', NULL, NULL, NULL, N'', 0),
  (1130, N'भाजीपाला दुकान', N'Vegetable Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1131, N'भाजीपाला मार्केट', N'Vegetable Market', N'S', NULL, NULL, NULL, N'', 0),
  (1132, N'भाजीपाला शॉप', N'Vegetable Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1133, N'भाजीपाला सेंटर ', N'Vegetable Center', N'S', NULL, NULL, NULL, N'', 0),
  (1134, N'भांडे व्यापारी', N'Utensils Trader', N'S', NULL, NULL, NULL, N'', 0),
  (1135, N'भांड्याचे दुकान', N'Utensils Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1136, N'भांड्यांचे दुकान', N'Utensils Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1137, N'भांडी दुकान', N'Utensils Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1138, N'फॅब्रिकेशन अँड प्लायवूड वर्क्स', N'Fabrication and Plywood Works', N'S', NULL, NULL, NULL, N'', 0),
  (1139, N'फेब्रिकशन शॉप', N'Fabrication Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1140, N'फेब्रिकेशन शॉप', N'Fabrication Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1141, N'बिझनेस सोल्युशन ऑफिस', N'Business Solutions Office', N'S', NULL, NULL, NULL, N'', 0),
  (1143, N'निवासी,गोडाउन,दुकान', N'Residential, Godown and Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1144, N'बँक व वित्तीय संस्था ', N'Bank and Financial Institution', N'S', NULL, NULL, NULL, N'', 0),
  (1145, N'बँक व वित्तीय संस्था, वाचनालय', N'Bank, Financial Institution and Library', N'S', NULL, NULL, NULL, N'', 0),
  (1146, N'बँक/वित्तीय संस्था व कार्यालय व गोडाउन', N'Bank / Financial Institution, Office and Godown', N'S', NULL, NULL, NULL, N'', 0),
  (1147, N'बँक/वित्तीय संस्था व कार्यालय व निवासी', N'Bank / Financial Institution, Office and Residential', N'S', NULL, NULL, NULL, N'', 0),
  (1148, N'बँक/वित्तीय संस्था व दुकान', N'Bank / Financial Institution and Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1149, N'मंगल कार्यालय/टॉकीज व निवासी', N'Marriage Hall / Cinema and Residential', N'S', NULL, NULL, NULL, N'', 0),
  (1150, N'वसतिगृह', N'Hostel', N'S', NULL, NULL, NULL, N'', 0),
  (1152, N'अनिवासी', N'Non-Residential', N'S', NULL, NULL, NULL, N'', 0),
  (1153, N'अनिवासी व कार्यालय', N'Non-Residential and Office', N'S', NULL, NULL, NULL, N'', 0),
  (1154, N'अनिवासी व निवासी', N'Non-Residential and Residential', N'S', NULL, NULL, NULL, N'', 0),
  (1155, N'कारखाना', N'Factory', N'S', NULL, NULL, NULL, N'', 0),
  (1156, N'कार्यालय व गोडाउन ', N'Office and Godown', N'S', NULL, NULL, NULL, N'', 0),
  (1157, N'कार्यालय व दवाखाना', N'Office and Clinic', N'S', NULL, NULL, NULL, N'', 0),
  (1158, N'कार्यालय,दुकान,निवासी', N'Office, Shop and Residential', N'S', NULL, NULL, NULL, N'', 0),
  (1159, N'खाजगी रुग्णालय व दुकान', N'Private Hospital and Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1160, N'खाजगी रूग्णालय व निवासी', N'Private Hospital and Residential', N'S', NULL, NULL, NULL, N'', 0),
  (1161, N'खाजगी शाळा व निवासी', N'Private School and Residential', N'S', NULL, NULL, NULL, N'', 0),
  (1162, N'दुकान व कार्यालय', N'Shop and Office', N'S', NULL, NULL, NULL, N'', 0),
  (1163, N'दुकान,दवाखाना,निवासी,बँक/वित्तीय', N'Shop, Clinic, Residential and Bank / Financial', N'S', NULL, NULL, NULL, N'', 0),
  (1164, N'दवाखाना व दुकान', N'Clinic and Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1165, N'दवाखाना व निवासी', N'Clinic and Residential', N'S', NULL, NULL, NULL, N'', 0),
  (1166, N'धार्मिक स्थळ व अनिवासी', N'Religious Place and Non-Residential', N'S', NULL, NULL, NULL, N'', 0),
  (1167, N'निवासी व कार्यालय', N'Residential and Office', N'S', NULL, NULL, NULL, N'', 0),
  (1168, N'निवासी व कोचिंग क्लासेस', N'Residential and Coaching Classes', N'S', NULL, NULL, NULL, N'', 0),
  (1169, N'निवासी व दुकान', N'Residential and Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1170, N'भांगारचे दुकान ', N'Scrap Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1171, N'भाजी', N'Vegetable', N'S', NULL, NULL, NULL, N'', 0),
  (1172, N'भाजी दुकान', N'Vegetable Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1173, N'भाजी पाला शॉप', N'Vegetable Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1174, N'हॉस्पिटल', N'Hospital', N'S', NULL, NULL, NULL, N'', 0),
  (1175, N'होम अपलाएन्स', N'Home Appliances', N'S', NULL, NULL, NULL, N'', 0),
  (1176, N'होम इंटेरियल', N'Home Interior', N'S', NULL, NULL, NULL, N'', 0),
  (1177, N'होम क्लिनिंग सामग्री', N'Home Cleaning Materials', N'S', NULL, NULL, NULL, N'', 0),
  (1178, N'होमिओपॅथीक क्लिनिक', N'Homeopathic Clinic', N'S', NULL, NULL, NULL, N'', 0),
  (1179, N'ॉस्पिटल', N'Hospital', N'S', NULL, NULL, NULL, N'', 0),
  (1180, N'सी सी टी वी कॅमेरा दुकान', N'CCTV Camera Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1181, N'सी सी टीव्ही विक्रेता', N'CCTV Seller', N'S', NULL, NULL, NULL, N'', 0),
  (1182, N'सी.सी.टीव्ही ', N'CCTV', N'S', NULL, NULL, NULL, N'', 0),
  (1183, N'सीए ऑफिस', N'CA Office', N'S', NULL, NULL, NULL, N'', 0),
  (1184, N'सॉफ्ट टेक्नॉलजी', N'Software Technology', N'S', NULL, NULL, NULL, N'', 0),
  (1185, N'सॉफ्टवेअर कंपनी ऑफिस', N'Software Company Office', N'S', NULL, NULL, NULL, N'', 0),
  (1186, N'सोफा मेकर', N'Sofa Maker', N'S', NULL, NULL, NULL, N'', 0),
  (1187, N'सोफा मेकर्स', N'Sofa Makers', N'S', NULL, NULL, NULL, N'', 0),
  (1188, N'सोफा रिपेअरींग', N'Sofa Repair', N'S', NULL, NULL, NULL, N'', 0),
  (1189, N'सोफा विक्री', N'Sofa Sales', N'S', NULL, NULL, NULL, N'', 0),
  (1190, N'सोफा शिवणे', N'Sofa Stitching', N'S', NULL, NULL, NULL, N'', 0),
  (1191, N'हेअर सलून', N'Hair Salon', N'S', NULL, NULL, NULL, N'', 0),
  (1192, N'हेयर कटिंग', N'Hair Cutting', N'S', NULL, NULL, NULL, N'', 0),
  (1193, N'हेयर कटिंग सलून', N'Hair Cutting Salon', N'S', NULL, NULL, NULL, N'', 0),
  (1194, N'हेयर सलुन', N'Hair Salon', N'S', NULL, NULL, NULL, N'', 0),
  (1195, N'हेयर सलून', N'Hair Salon', N'S', NULL, NULL, NULL, N'', 0),
  (1196, N'हर्बल मेडिकल', N'Herbal Medical Store', N'S', NULL, NULL, NULL, N'', 0),
  (1197, N'हेल्थ सेंटर', N'Health Center', N'S', NULL, NULL, NULL, N'', 0),
  (1198, N'हेल्थ स्टोर', N'Health Store', N'S', NULL, NULL, NULL, N'', 0),
  (1199, N'हेल्थकेअर  कंपनी ऑफिस', N'Healthcare Company Office', N'S', NULL, NULL, NULL, N'', 0),
  (1200, N'हाइड्रोलिक्स पाईप', N'Hydraulic Pipe', N'S', NULL, NULL, NULL, N'', 0),
  (1201, N'हार्डवेअर', N'Hardware', N'S', NULL, NULL, NULL, N'', 0),
  (1202, N'हार्डवेअर अँड इलेक्ट्रॉनिक्स शॉप', N'Hardware and Electronics Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1203, N'हार्डवेअर आणि इलेक्ट्रिकल  स्टोअर', N'Hardware and Electrical Store', N'S', NULL, NULL, NULL, N'', 0),
  (1204, N'हार्डवेअर आणि ईलेक्ट्रिक्स', N'Hardware and Electricals', N'S', NULL, NULL, NULL, N'', 0),
  (1205, N'हार्डवेअर शॉप', N'Hardware Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1206, N'हार्डवेयर / इलेक्ट्रिक', N'Hardware / Electrical', N'S', NULL, NULL, NULL, N'', 0),
  (1207, N'हार्दिक प्ल्यायवूड', N'Hardik Plywood', N'S', NULL, NULL, NULL, N'', 0),
  (1210, N'देशी दारू व बियर शॉप', N'Country Liquor and Beer Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1215, N'जेनेरीक मेडिकल', N'Generic Medical Store', N'S', NULL, NULL, NULL, N'', 0),
  (1217, N'ट्याटु पार्लर', N'Tattoo Parlour', N'S', NULL, NULL, NULL, N'', 0),
  (1219, N'मेडिकल अँन्ड जनरल स्टोअर', N'Medical and General Store', N'S', NULL, NULL, NULL, N'', 0),
  (1221, N'सोने, चांदीचे दुकानं', N'Gold and Silver Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1222, N'कोचिंग क्लाससेस', N'Coaching Classes', N'S', NULL, NULL, NULL, N'', 0),
  (1223, N'कोटींग ऑफ मेटल्स', N'Metal Coating', N'S', NULL, NULL, NULL, N'', 0),
  (1224, N'मिनी मार्केट ', N'Mini Market', N'S', NULL, NULL, NULL, N'', 0),
  (1225, N'मिल्क सेंटर ', N'Milk Center', N'S', NULL, NULL, NULL, N'', 0),
  (1226, N'कार सेल्स', N'Car Sales', N'S', NULL, NULL, NULL, N'', 0),
  (1227, N'इलेक्ट्रॉनिक्स सेल्स अँड सर्विस', N'Electronics Sales and Service', N'S', NULL, NULL, NULL, N'', 0),
  (1228, N'ए. टी. एम', N'ATM', N'S', NULL, NULL, NULL, N'', 0),
  (1230, N'टी.वी.रीपेरिंग सेंटर', N'TV Repair Center', N'S', NULL, NULL, NULL, N'', 0),
  (1231, N'टीव्ही रेपेरिंग सेंटर', N'TV Repair Center', N'S', NULL, NULL, NULL, N'', 0),
  (1232, N'डेअरी', N'Dairy', N'S', NULL, NULL, NULL, N'', 0),
  (1233, N'डेअरी प्रोडक्टस', N'Dairy Products', N'S', NULL, NULL, NULL, N'', 0),
  (1234, N'डेअरी शॉप', N'Dairy Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1235, N'डेंटल केअर', N'Dental Care', N'S', NULL, NULL, NULL, N'', 0),
  (1236, N'डेंटल क्लिनिक', N'Dental Clinic', N'S', NULL, NULL, NULL, N'', 0),
  (1237, N'डेन्टल क्लिनिक', N'Dental Clinic', N'S', NULL, NULL, NULL, N'', 0),
  (1238, N'डेन्टल क्लिनिक दवाखाना', N'Dental Clinic', N'S', NULL, NULL, NULL, N'', 0),
  (1239, N'डेयरी', N'Dairy', N'S', NULL, NULL, NULL, N'', 0),
  (1240, N'ड्रायक्लिनर्स शॉप', N'Dry Cleaners Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1241, N'ड्रायक्लीनर्स', N'Dry Cleaners', N'S', NULL, NULL, NULL, N'', 0),
  (1242, N'ड्रायफूड्स', N'Dry Foods', N'S', NULL, NULL, NULL, N'', 0),
  (1243, N'ड्रायफ्रुटस मार्केट', N'Dry Fruits Market', N'S', NULL, NULL, NULL, N'', 0),
  (1244, N'डेरी', N'Dairy', N'S', NULL, NULL, NULL, N'', 0),
  (1245, N'डेल कम्प्युटर शोरूम', N'Dell Computer Showroom', N'S', NULL, NULL, NULL, N'', 0),
  (1246, N'डेलिमार्ट', N'Daily Mart', N'S', NULL, NULL, NULL, N'', 0),
  (1247, N'डेली नीड्स', N'Daily Needs', N'S', NULL, NULL, NULL, N'', 0),
  (1248, N'डेली मार्ट', N'Daily Mart', N'S', NULL, NULL, NULL, N'', 0),
  (1249, N'डेवलपर्स ऑफिस', N'Developers Office', N'S', NULL, NULL, NULL, N'', 0),
  (1250, N'डेव्हलपर्स ऑफिस', N'Developers Office', N'S', NULL, NULL, NULL, N'', 0),
  (1251, N'डायग्नोस्टिक लॅब', N'Diagnostic Lab', N'S', NULL, NULL, NULL, N'', 0),
  (1252, N'डायग्नोस्टिक लॅबोरेटरी', N'Diagnostic Laboratory', N'S', NULL, NULL, NULL, N'', 0),
  (1253, N'डायग्नोस्टीक सेंटर', N'Diagnostic Center', N'S', NULL, NULL, NULL, N'', 0),
  (1254, N'डायपर बिजनेस', N'Diaper Business', N'S', NULL, NULL, NULL, N'', 0),
  (1255, N'डायलेसिस सेंटर', N'Dialysis Center', N'S', NULL, NULL, NULL, N'', 0),
  (1256, N'डिझाइन किचन फर्निचर', N'Designer Kitchen Furniture', N'S', NULL, NULL, NULL, N'', 0),
  (1257, N'डिलेव्हरी किचन', N'Delivery Kitchen', N'S', NULL, NULL, NULL, N'', 0),
  (1258, N'डिलिव्हरी शॉप', N'Delivery Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1259, N'डिलीवरी सेंटर', N'Delivery Center', N'S', NULL, NULL, NULL, N'', 0),
  (1260, N'डिस्ट्रिबयूशन', N'Distribution', N'S', NULL, NULL, NULL, N'', 0),
  (1261, N'डिस्ट्रिब्युशन', N'Distribution', N'S', NULL, NULL, NULL, N'', 0),
  (1262, N'डिस्ट्रिब्यूशन', N'Distribution', N'S', NULL, NULL, NULL, N'', 0),
  (1263, N'डी.एम.आय.टी.टेस्ट', N'DMIT Test', N'S', NULL, NULL, NULL, N'', 0),
  (1264, N'डोळ्यांचे क्लिनिक ', N'Eye Clinic', N'S', NULL, NULL, NULL, N'', 0),
  (1265, N'डोळ्यांचा दवखाना', N'Eye Clinic', N'S', NULL, NULL, NULL, N'', 0),
  (1266, N'तेल व्यवसाय', N'Oil Business', N'S', NULL, NULL, NULL, N'', 0),
  (1267, N'थर्ड पार्टी इन्सपेक्शन ऑफिस', N'Third Party Inspection Office', N'S', NULL, NULL, NULL, N'', 0),
  (1268, N'थेरिपी सेंटर (कार्यालय)', N'Therapy Center Office', N'S', NULL, NULL, NULL, N'', 0),
  (1269, N'दुकान व डेअरी', N'Shop and Dairy', N'S', NULL, NULL, NULL, N'', 0),
  (1270, N'दूध केंद्र', N'Milk Center', N'S', NULL, NULL, NULL, N'', 0),
  (1271, N'दुध डेअरी ', N'Milk Dairy', N'S', NULL, NULL, NULL, N'', 0),
  (1272, N'दूध डेअरी', N'Milk Dairy', N'S', NULL, NULL, NULL, N'', 0),
  (1273, N'दूध डेअरी सप्लायर', N'Milk Dairy Supplier', N'S', NULL, NULL, NULL, N'', 0),
  (1274, N'दवखाना', N'Clinic', N'S', NULL, NULL, NULL, N'', 0),
  (1275, N'दवाखाना', N'Clinic', N'S', NULL, NULL, NULL, N'', 0),
  (1276, N'दवाखाना व मेडिकल', N'Clinic and Medical', N'S', NULL, NULL, NULL, N'', 0),
  (1277, N'देशी बार', N'Country Bar', N'S', NULL, NULL, NULL, N'', 0),
  (1278, N'दातांचा दवाखाना ', N'Dental Clinic', N'S', NULL, NULL, NULL, N'', 0),
  (1279, N'नेटवर्क ', N'Network', N'S', NULL, NULL, NULL, N'', 0),
  (1280, N'नेटवर्किंग अँड सी.सी.टीव्ही', N'Networking and CCTV', N'S', NULL, NULL, NULL, N'', 0),
  (1281, N'न्यूट्रीशन क्लिनिक', N'Nutrition Clinic', N'S', NULL, NULL, NULL, N'', 0),
  (1282, N'नर्सरी स्कूल', N'Nursery School', N'S', NULL, NULL, NULL, N'', 0),
  (1284, N'नोव्हेल्टि', N'Novelty', N'S', NULL, NULL, NULL, N'', 0),
  (1285, N'नोव्हेलटी', N'Novelty', N'S', NULL, NULL, NULL, N'', 0),
  (1286, N'पॅकिंग मटेरियल', N'Packing Material', N'S', NULL, NULL, NULL, N'', 0),
  (1287, N'पंचर अँड टायर सर्विस ', N'Puncture and Tyre Service', N'S', NULL, NULL, NULL, N'', 0),
  (1288, N'पंचर दुकान ', N'Puncture Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1289, N'पूजा भंडार', N'Puja Items Store', N'S', NULL, NULL, NULL, N'', 0),
  (1290, N'पुजा भांडार', N'Puja Items Store', N'S', NULL, NULL, NULL, N'', 0),
  (1291, N'पूजा सामान', N'Puja Items', N'S', NULL, NULL, NULL, N'', 0),
  (1292, N'पूजा साहित्य', N'Puja Materials', N'S', NULL, NULL, NULL, N'', 0),
  (1293, N'पेट अॅनिमल फूड्स', N'Pet Animal Foods', N'S', NULL, NULL, NULL, N'', 0),
  (1294, N'पेंट कलर ', N'Paint and Color', N'S', NULL, NULL, NULL, N'', 0),
  (1295, N'पेट शॉप', N'Pet Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1296, N'पेंट शॉप', N'Paint Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1297, N'पेट स्टोअर', N'Pet Store', N'S', NULL, NULL, NULL, N'', 0),
  (1298, N'पेट्रोल पंप', N'Petrol Pump', N'S', NULL, NULL, NULL, N'', 0),
  (1299, N'पेंट्स', N'Paints', N'S', NULL, NULL, NULL, N'', 0),
  (1300, N'पेट्स फूड्स', N'Pet Foods', N'S', NULL, NULL, NULL, N'', 0),
  (1301, N'पतसंस्था', N'Credit Society', N'S', NULL, NULL, NULL, N'', 0),
  (1302, N'पतसंस्था / वाचनालय / ग्रंथालय', N'Credit Society / Library', N'S', NULL, NULL, NULL, N'', 0),
  (1303, N'पॅथलॅब्स', N'Path Labs', N'S', NULL, NULL, NULL, N'', 0),
  (1304, N'पॅथॉलॉजि लॅब ', N'Pathology Lab', N'S', NULL, NULL, NULL, N'', 0),
  (1305, N'पॅथॉलॉजी लॅबोरेटरी', N'Pathology Laboratory', N'S', NULL, NULL, NULL, N'', 0),
  (1307, N'पॅथोलॉजी लेबोरटोरी', N'Pathology Laboratory', N'S', NULL, NULL, NULL, N'', 0),
  (1308, N'पथोलोजि', N'Pathology', N'S', NULL, NULL, NULL, N'', 0),
  (1309, N'पेपर प्लेट', N'Paper Plate', N'S', NULL, NULL, NULL, N'', 0),
  (1310, N'पेपर मार्ट ', N'Paper Mart', N'S', NULL, NULL, NULL, N'', 0),
  (1311, N'पेपर रद्दी', N'Waste Paper', N'S', NULL, NULL, NULL, N'', 0),
  (1312, N'पेपर रिसायकल अँन्ड कलेक्शन', N'Paper Recycling and Collection', N'S', NULL, NULL, NULL, N'', 0),
  (1313, N'पेपर व भंगार दुकान', N'Paper and Scrap Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1314, N'परडा बनविणे ', N'Curtain Making', N'S', NULL, NULL, NULL, N'', 0),
  (1315, N'पूर्व प्राथमिक शाळा ', N'Pre-Primary School', N'S', NULL, NULL, NULL, N'', 0),
  (1316, N'प्रेस शॉप', N'Press Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1317, N'प्रिंटिंग', N'Printing', N'S', NULL, NULL, NULL, N'', 0),
  (1318, N'प्रिंटिंग दुकान', N'Printing Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1319, N'प्रिंटिग प्रेस', N'Printing Press', N'S', NULL, NULL, NULL, N'', 0),
  (1320, N'प्रिंटिंग शॉप', N'Printing Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1321, N'प्री प्रायमरी स्कूल', N'Pre-Primary School', N'S', NULL, NULL, NULL, N'', 0),
  (1322, N'प्री स्कूल', N'Pre-School', N'S', NULL, NULL, NULL, N'', 0),
  (1323, N'प्रॉपर्टि कन्सल्ट ऑफिस', N'Property Consultant Office', N'S', NULL, NULL, NULL, N'', 0),
  (1324, N'प्रॉपर्टि सेल्स', N'Property Sales', N'S', NULL, NULL, NULL, N'', 0),
  (1325, N'प्रॉपर्टी एजेण्ट', N'Property Agent', N'S', NULL, NULL, NULL, N'', 0),
  (1326, N'प्रॉपर्टी ऑफिस', N'Property Office', N'S', NULL, NULL, NULL, N'', 0),
  (1327, N'प्रॉपर्टी कन्सलटंट', N'Property Consultant', N'S', NULL, NULL, NULL, N'', 0),
  (1328, N'प्रॉपर्टी डीलर', N'Property Dealer', N'S', NULL, NULL, NULL, N'', 0),
  (1329, N'प्रॉपर्टीज ऑफिस', N'Properties Office', N'S', NULL, NULL, NULL, N'', 0),
  (1330, N'प्रोटीन', N'Protein Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1331, N'गणपती विक्री', N'Ganpati Idol Sales', N'S', NULL, NULL, NULL, N'', 0),
  (1332, N'गेम झोन', N'Game Zone', N'S', NULL, NULL, NULL, N'', 0),
  (1333, N'गेमिंग कॅफे', N'Gaming Cafe', N'S', NULL, NULL, NULL, N'', 0),
  (1334, N'गेमिंग झोन', N'Gaming Zone', N'S', NULL, NULL, NULL, N'', 0),
  (1335, N'गॅरेज', N'Garage', N'S', NULL, NULL, NULL, N'', 0),
  (1336, N'ग्राफिक अँड प्रिंट ', N'Graphic and Print', N'S', NULL, NULL, NULL, N'', 0),
  (1337, N'ग्राफिक्स अँड गॅरेज', N'Graphics and Garage', N'S', NULL, NULL, NULL, N'', 0),
  (1338, N'ग्राफिक्स्स ', N'Graphics', N'S', NULL, NULL, NULL, N'', 0),
  (1339, N'ग्राफिक्स्स वर्क शॉप कार्यालय', N'Graphics Workshop Office', N'S', NULL, NULL, NULL, N'', 0),
  (1340, N'गॅलरी', N'Gallery', N'S', NULL, NULL, NULL, N'', 0),
  (1341, N'ग्लास अँड अलुमिनियम हाऊस ', N'Glass and Aluminium House', N'S', NULL, NULL, NULL, N'', 0),
  (1342, N'ग्लास अँड अल्युमिनियम', N'Glass and Aluminium', N'S', NULL, NULL, NULL, N'', 0),
  (1343, N'ग्लास अँड अल्युमीनियम', N'Glass and Aluminium', N'S', NULL, NULL, NULL, N'', 0),
  (1344, N'ग्लास अँन्ड अॅल्युमिनियम', N'Glass and Aluminium', N'S', NULL, NULL, NULL, N'', 0),
  (1345, N'ग्लास व्यापार', N'Glass Trading', N'S', NULL, NULL, NULL, N'', 0),
  (1346, N'ग्लास वर्क', N'Glass Work', N'S', NULL, NULL, NULL, N'', 0),
  (1347, N'ग्लास वर्क शॉप', N'Glass Workshop', N'S', NULL, NULL, NULL, N'', 0),
  (1348, N'ग्लास वर्कशॉप', N'Glass Workshop', N'S', NULL, NULL, NULL, N'', 0),
  (1349, N'ग्लास विक्री', N'Glass Sales', N'S', NULL, NULL, NULL, N'', 0),
  (1350, N'ग्लास शॉप', N'Glass Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1351, N'ग्लास हाऊस', N'Glass House', N'S', NULL, NULL, NULL, N'', 0),
  (1352, N'ग्लोसरी शॉप', N'Grocery Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1353, N'गव्हरमेंट प्रोजेक्ट ऑफिस', N'Government Project Office', N'S', NULL, NULL, NULL, N'', 0),
  (1354, N'गॅस ऑफिस ', N'Gas Office', N'S', NULL, NULL, NULL, N'', 0),
  (1355, N'गॅस बूकींग ऑफिस', N'Gas Booking Office', N'S', NULL, NULL, NULL, N'', 0),
  (1356, N'गॅस स्टोव्ह, इलेक्ट्रिकल्स सेल्स अँड सर्विसेस', N'Gas Stove and Electrical Sales and Services', N'S', NULL, NULL, NULL, N'', 0),
  (1357, N'गाडी विक्री', N'Vehicle Sales', N'S', NULL, NULL, NULL, N'', 0),
  (1358, N'गादी अँड कुशन शॉप', N'Mattress and Cushion Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1359, N'गादी दुकान ', N'Mattress Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1360, N'गादी व्यवसाय', N'Mattress Business', N'S', NULL, NULL, NULL, N'', 0),
  (1361, N'गादी विक्री', N'Mattress Sales', N'S', NULL, NULL, NULL, N'', 0),
  (1362, N'गादी सेंन्टर', N'Mattress Center', N'S', NULL, NULL, NULL, N'', 0),
  (1363, N'गारमेंट', N'Garment', N'S', NULL, NULL, NULL, N'', 0),
  (1364, N'गिफ्ट अँड सेल्स', N'Gift and Sales', N'S', NULL, NULL, NULL, N'', 0),
  (1365, N'गिफ्ट आर्ट ', N'Gift Art', N'S', NULL, NULL, NULL, N'', 0),
  (1366, N'गिफ्ट शॉप', N'Gift Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1367, N'गिफ्ट स्टोअर्स', N'Gift Stores', N'S', NULL, NULL, NULL, N'', 0),
  (1368, N'गिरणी', N'Mill', N'S', NULL, NULL, NULL, N'', 0),
  (1369, N'गॉरेज', N'Garage', N'S', NULL, NULL, NULL, N'', 0),
  (1370, N'गोकुल डेअरी', N'Gokul Dairy', N'S', NULL, NULL, NULL, N'', 0),
  (1371, N'गोड प्रकार बनवतात', N'Sweet Products Manufacturing', N'S', NULL, NULL, NULL, N'', 0),
  (1372, N'गोडाउन', N'Godown', N'S', NULL, NULL, NULL, N'', 0),
  (1373, N'गोडाउन (मंडप डेकोरेटर)', N'Godown (Mandap Decorator)', N'S', NULL, NULL, NULL, N'', 0),
  (1374, N'गोडाउन प्लंबिंग ', N'Godown Plumbing', N'S', NULL, NULL, NULL, N'', 0),
  (1376, N'गोल्ड शॉप', N'Gold Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1377, N'गोळ्या औषधी शॉप', N'Medicine Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1378, N'गोळ्या व औषधी गोडाउन', N'Medicine Godown', N'S', NULL, NULL, NULL, N'', 0),
  (1379, N'गोळ्यांचे गोडाउन', N'Medicine Godown', N'S', NULL, NULL, NULL, N'', 0),
  (1380, N'गौ. विज्ञान केंद्र', N'Cow Science Center', N'S', NULL, NULL, NULL, N'', 0),
  (1381, N'घड्याळ विक्री', N'Watch Sales', N'S', NULL, NULL, NULL, N'', 0),
  (1382, N'घर विक्रि', N'House Sales', N'S', NULL, NULL, NULL, N'', 0),
  (1383, N'घर विक्री/बिल्डर', N'House Sales / Builder', N'S', NULL, NULL, NULL, N'', 0),
  (1384, N'चप्पल दुकान', N'Footwear Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1385, N'चप्पल विक्री', N'Footwear Sales', N'S', NULL, NULL, NULL, N'', 0),
  (1386, N'चप्पलचे दुकान', N'Footwear Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1387, N'चश्मा शॉप', N'Optical Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1388, N'चष्म्याचे दुकान', N'Optical Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1389, N'चष्माचे दुकान', N'Optical Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1390, N'ज्वेलर्स', N'Jewellers', N'S', NULL, NULL, NULL, N'', 0),
  (1391, N'ज्वेलर्स शॉप', N'Jewellers Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1392, N'ज्वेलरी शॉप', N'Jewellery Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1393, N'जिओ स्टोअर', N'Jio Store', N'S', NULL, NULL, NULL, N'', 0),
  (1395, N'जीम', N'Gym', N'S', NULL, NULL, NULL, N'', 0),
  (1396, N'झेरॉक्स', N'Xerox', N'S', NULL, NULL, NULL, N'', 0),
  (1397, N'झेरॉक्स अँड घरगुती सामान विक्रेता ', N'Xerox and Household Goods Seller', N'S', NULL, NULL, NULL, N'', 0),
  (1398, N'झेरॉक्स अँड टायपिंग', N'Xerox and Typing', N'S', NULL, NULL, NULL, N'', 0),
  (1399, N'झेरॉक्स अँड रीयल इस्टेट', N'Xerox and Real Estate', N'S', NULL, NULL, NULL, N'', 0),
  (1400, N'झेरॉक्स दुकान', N'Xerox Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1401, N'झेरॉक्स व स्टेशनरी', N'Xerox and Stationery', N'S', NULL, NULL, NULL, N'', 0),
  (1402, N'झेरॉक्स शॉप', N'Xerox Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1403, N'झेरॉक्स सेंटर', N'Xerox Center', N'S', NULL, NULL, NULL, N'', 0),
  (1404, N'टू व्हीलर ऑटो गॅरेज', N'Two Wheeler Auto Garage', N'S', NULL, NULL, NULL, N'', 0),
  (1405, N'टु व्हीलर गॅरेज ', N'Two Wheeler Garage', N'S', NULL, NULL, NULL, N'', 0),
  (1406, N'टेकनोलोजी ', N'Technology', N'S', NULL, NULL, NULL, N'', 0),
  (1407, N'टॅक्स कन्सल्टंटं', N'Tax Consultant', N'S', NULL, NULL, NULL, N'', 0),
  (1408, N'टॅक्स कन्सल्टंट ऑफिस ', N'Tax Consultant Office', N'S', NULL, NULL, NULL, N'', 0),
  (1409, N'टॅक्स कन्सलटन्ट', N'Tax Consultant', N'S', NULL, NULL, NULL, N'', 0),
  (1410, N'टॅक्स सेर्विसेस ऑफिस', N'Tax Services Office', N'S', NULL, NULL, NULL, N'', 0),
  (1411, N'टॅटू सेंटर', N'Tattoo Center', N'S', NULL, NULL, NULL, N'', 0),
  (1412, N'ट्युशन क्लास', N'Tuition Class', N'S', NULL, NULL, NULL, N'', 0),
  (1413, N'ट्यूशन क्लास', N'Tuition Class', N'S', NULL, NULL, NULL, N'', 0),
  (1414, N'ट्युशन क्लासेस', N'Tuition Classes', N'S', NULL, NULL, NULL, N'', 0),
  (1415, N'ट्रेडिंग ऑफिस', N'Trading Office', N'S', NULL, NULL, NULL, N'', 0),
  (1416, N'ट्रेडिग कार्यालय', N'Trading Office', N'S', NULL, NULL, NULL, N'', 0),
  (1417, N'ट्रेन्ड लिमिटेड', N'Trent Limited', N'S', NULL, NULL, NULL, N'', 0),
  (1418, N'टूर्स अँड ट्रॅव्हल्स', N'Tours and Travels', N'S', NULL, NULL, NULL, N'', 0),
  (1419, N'टुर्स अँन्ड ट्रॅव्हल्स ऑफिस', N'Tours and Travels Office', N'S', NULL, NULL, NULL, N'', 0),
  (1420, N'टुर्स आणि ट्रॅवलस', N'Tours and Travels', N'S', NULL, NULL, NULL, N'', 0),
  (1421, N'ट्रान्सपोर्ट', N'Transport', N'S', NULL, NULL, NULL, N'', 0),
  (1422, N'ट्रान्सपोर्ट ऑफिस ', N'Transport Office', N'S', NULL, NULL, NULL, N'', 0),
  (1423, N'ट्रान्सपोर्ट व्यवसाय', N'Transport Business', N'S', NULL, NULL, NULL, N'', 0),
  (1424, N'ट्रावलिंग  ऑफिस', N'Travel Office', N'S', NULL, NULL, NULL, N'', 0),
  (1425, N'ट्रांसपोर्ट ', N'Transport', N'S', NULL, NULL, NULL, N'', 0),
  (1426, N'टेलर', N'Tailor', N'S', NULL, NULL, NULL, N'', 0),
  (1427, N'टेलर शॉप', N'Tailor Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1428, N'टेलर्स', N'Tailors', N'S', NULL, NULL, NULL, N'', 0),
  (1429, N'टेलर्स वर्क्स', N'Tailors Works', N'S', NULL, NULL, NULL, N'', 0),
  (1430, N'टेलर्स शॉप', N'Tailors Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1431, N'टेलरिंग', N'Tailoring', N'S', NULL, NULL, NULL, N'', 0),
  (1432, N'टेलरिंग शॉप', N'Tailoring Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1433, N'टूव्हीलर सर्विस सेंटर', N'Two Wheeler Service Center', N'S', NULL, NULL, NULL, N'', 0),
  (1434, N'टुशन क्लासेस', N'Tuition Classes', N'S', NULL, NULL, NULL, N'', 0),
  (1435, N'टेस्ट ट्यूब बेबी सेंटर', N'IVF Center', N'S', NULL, NULL, NULL, N'', 0),
  (1436, N'टाईल्स गोडाउन', N'Tiles Godown', N'S', NULL, NULL, NULL, N'', 0),
  (1437, N'टायकांडो एजुकेशन सेंटर', N'Taekwondo Education Center', N'S', NULL, NULL, NULL, N'', 0),
  (1438, N'टायर शॉप', N'Tyre Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1439, N'टायर शॉप आणि रिपेरिंग', N'Tyre Shop and Repair', N'S', NULL, NULL, NULL, N'', 0),
  (1440, N'टायर सेल्स अँड सर्विसेस', N'Tyre Sales and Services', N'S', NULL, NULL, NULL, N'', 0),
  (1441, N'टायर्स शॉप', N'Tyres Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1442, N'चिकन शॉप', N'Chicken Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1443, N'चिकन सेंटर', N'Chicken Center', N'S', NULL, NULL, NULL, N'', 0),
  (1444, N'चिल्ड्रन क्लीनिक', N'Children''s Clinic', N'S', NULL, NULL, NULL, N'', 0),
  (1445, N'जेंट्स पार्लर', N'Gents Parlour', N'S', NULL, NULL, NULL, N'', 0),
  (1446, N'जेंट्स सलुन', N'Gents Salon', N'S', NULL, NULL, NULL, N'', 0),
  (1447, N'जेंट्स सलून', N'Gents Salon', N'S', NULL, NULL, NULL, N'', 0),
  (1448, N'जुने कागद व भंडार', N'Old Paper and Scrap Store', N'S', NULL, NULL, NULL, N'', 0),
  (1449, N'जेन्टस पार्लर', N'Gents Parlour', N'S', NULL, NULL, NULL, N'', 0),
  (1450, N'जनरल मार्ट', N'General Mart', N'S', NULL, NULL, NULL, N'', 0),
  (1451, N'जनरल स्टोअर अँड चिकन शॉप', N'General Store and Chicken Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1452, N'जनरल स्टोअर्स', N'General Stores', N'S', NULL, NULL, NULL, N'', 0),
  (1453, N'जनरल स्टोअर्स मार्ट', N'General Stores Mart', N'S', NULL, NULL, NULL, N'', 0),
  (1454, N'जनरल स्टोर', N'General Store', N'S', NULL, NULL, NULL, N'', 0),
  (1455, N'ज्यूस अँड भाजी दुकान ', N'Juice and Vegetable Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1456, N'प्लाइवूड मटेरियल सप्लायर', N'Plywood Material Supplier', N'S', NULL, NULL, NULL, N'', 0),
  (1457, N'प्लायूड', N'Plywood', N'S', NULL, NULL, NULL, N'', 0),
  (1458, N'प्लायवूड', N'Plywood', N'S', NULL, NULL, NULL, N'', 0),
  (1459, N'प्लायवूड अँड इंटेरीयल', N'Plywood and Interior', N'S', NULL, NULL, NULL, N'', 0),
  (1460, N'प्लायवूड अँड हार्डवेअर', N'Plywood and Hardware', N'S', NULL, NULL, NULL, N'', 0),
  (1461, N'प्लायवूड अँड हार्डवेअर शॉप', N'Plywood and Hardware Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1462, N'प्लायवूड आर्ट', N'Plywood Art', N'S', NULL, NULL, NULL, N'', 0),
  (1463, N'प्लायवूड गोडाउन ', N'Plywood Godown', N'S', NULL, NULL, NULL, N'', 0),
  (1464, N'प्लायवूड शॉप', N'Plywood Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1465, N'प्लायवूड स्टोअर', N'Plywood Store', N'S', NULL, NULL, NULL, N'', 0),
  (1466, N'पशु दवाखाना ', N'Veterinary Clinic', N'S', NULL, NULL, NULL, N'', 0),
  (1467, N'पशु सामग्री दुकान', N'Pet Supplies Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1468, N'पैसे पाठवणे', N'Money Transfer', N'S', NULL, NULL, NULL, N'', 0),
  (1469, N'पेस्ट कंट्रोल ', N'Pest Control', N'S', NULL, NULL, NULL, N'', 0),
  (1470, N'पेस्ट कंट्रोल ऑफिस', N'Pest Control Office', N'S', NULL, NULL, NULL, N'', 0),
  (1471, N'पा सेंटर', N'Pan Center', N'S', NULL, NULL, NULL, N'', 0),
  (1472, N'पाईप गोडाउन', N'Pipe Godown', N'S', NULL, NULL, NULL, N'', 0),
  (1473, N'पाण्याचे प्लान्ट', N'Water Plant', N'S', NULL, NULL, NULL, N'', 0),
  (1474, N'पान , ट्रॅव्हल्स', N'Pan and Travels', N'S', NULL, NULL, NULL, N'', 0),
  (1476, N'पापड दुकान', N'Papad Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1477, N'पार्लर', N'Parlour', N'S', NULL, NULL, NULL, N'', 0),
  (1478, N'पाळणाघर', N'Day Care Center', N'S', NULL, NULL, NULL, N'', 0),
  (1479, N'पावर लॉन्ड्री शॉप', N'Power Laundry Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1480, N'बुक्स शॉप', N'Books Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1481, N'बूकिंग ऑफिस', N'Booking Office', N'S', NULL, NULL, NULL, N'', 0),
  (1482, N'बॅग कलेक्शन', N'Bag Collection', N'S', NULL, NULL, NULL, N'', 0),
  (1483, N'बॅग शॉप', N'Bag Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1484, N'बॅग हाऊस', N'Bag House', N'S', NULL, NULL, NULL, N'', 0),
  (1485, N'बॅगचे दुकान ', N'Bag Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1486, N'बॅटरी डीलर ऑफिस ', N'Battery Dealer Office', N'S', NULL, NULL, NULL, N'', 0),
  (1487, N'बॅटरी विक्रेता', N'Battery Seller', N'S', NULL, NULL, NULL, N'', 0),
  (1488, N'बॅटरी शॉप ', N'Battery Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1489, N'बॅटरी हाऊस', N'Battery House', N'S', NULL, NULL, NULL, N'', 0),
  (1490, N'बुटीक टेलरिंग', N'Boutique Tailoring', N'S', NULL, NULL, NULL, N'', 0),
  (1491, N'बुटीक टेलरिंग शॉप', N'Boutique Tailoring Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1492, N'बुटीक दुकान', N'Boutique Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1493, N'बुटीक शॉप', N'Boutique Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1494, N'बॅंन्ड ऑफिस', N'Band Office', N'S', NULL, NULL, NULL, N'', 0),
  (1495, N'ब्युटि प्रोडक्टस अँड स्टेशनरि', N'Beauty Products and Stationery', N'S', NULL, NULL, NULL, N'', 0),
  (1496, N'ब्युटि पार्लर', N'Beauty Parlour', N'S', NULL, NULL, NULL, N'', 0),
  (1497, N'ब्युटि सलुन ', N'Beauty Salon', N'S', NULL, NULL, NULL, N'', 0),
  (1498, N'ब्युटिक', N'Boutique', N'S', NULL, NULL, NULL, N'', 0),
  (1499, N'ब्युटिक शॉप', N'Boutique Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1500, N'ब्युटिशर्न शॉप', N'Beautician Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1501, N'ब्युटी पार्लर', N'Beauty Parlour', N'S', NULL, NULL, NULL, N'', 0),
  (1502, N'ब्युटी सलून', N'Beauty Salon', N'S', NULL, NULL, NULL, N'', 0),
  (1503, N'ब्युटीक', N'Boutique', N'S', NULL, NULL, NULL, N'', 0),
  (1504, N'फिटनेस डांस स्टुडिओ ', N'Fitness Dance Studio', N'S', NULL, NULL, NULL, N'', 0),
  (1505, N'फिश अँड पेट्स स्टोअर', N'Fish and Pets Store', N'S', NULL, NULL, NULL, N'', 0),
  (1506, N'फिश शॉप', N'Fish Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1507, N'फिश सेंटर ', N'Fish Center', N'S', NULL, NULL, NULL, N'', 0),
  (1508, N'फॉसीलेक्स ऑइल', N'Fossilex Oil', N'S', NULL, NULL, NULL, N'', 0),
  (1509, N'फोटो फ्रेम ', N'Photo Frame Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1510, N'फोटो शॉप', N'Photo Shop', N'S', NULL, NULL, NULL, N'', 0),
  (1511, N'फोटो स्टुडिओ', N'Photo Studio', N'S', NULL, NULL, NULL, N'', 0),
  (1512, N'फोटोग्राफी कार्यालय  ', N'Photography Office', N'S', NULL, NULL, NULL, N'', 0),
  (1513, N'बँक', N'Bank', N'S', NULL, NULL, NULL, N'', 0),
  (1514, N'बॅंक', N'Bank', N'S', NULL, NULL, NULL, N'', 0),
  (1515, N'बॅंक (फायनंस)', N'Bank Finance', N'S', NULL, NULL, NULL, N'', 0),
  (1516, N'बँक ऑफ इंडिया', N'Bank of India', N'S', NULL, NULL, NULL, N'', 0),
  (1517, N'बँक वित्तीय संस्था', N'Bank Financial Institution', N'S', NULL, NULL, NULL, N'', 0),
  (1518, N'बूक स्टोअर अँड श्टेशन', N'Book Store and Stationery', N'S', NULL, NULL, NULL, N'', 0),
  (1519, N'बूक स्टोअर अँड श्टेशनरी', N'Book Store and Stationery', N'S', NULL, NULL, NULL, N'', 0),
  (1520, N'बुक स्टोर', N'Book Store', N'S', NULL, NULL, NULL, N'', 0),
  (1521, N'बँक/वित्तीय व संस्था कार्यालय ', N'Bank / Financial Institution Office', N'S', NULL, NULL, NULL, N'', 0)
   ) v(Id, [Description], [DescriptionEnglish], TypeOfUseCode, CreatedBy, UpdatedBy, UpdatedDate, SearchKey, SearchSequence)
)
INSERT PTIS.SubTypeOfUseMaster
(Id, [Description], [DescriptionEnglish], TypeOfUseId, CreatedBy, UpdatedBy, UpdatedDate, SearchSequence)
SELECT
    s.Id,
    s.[Description],
    s.[DescriptionEnglish],
    t.Id,         
    s.CreatedBy,
    s.UpdatedBy,
    s.UpdatedDate,
    s.SearchSequence
FROM Seed s
JOIN PTIS.TypeOfUseMaster t
  ON t.TypeOfUseCode = s.TypeOfUseCode;

SET IDENTITY_INSERT PTIS.SubTypeOfUseMaster OFF;



SET IDENTITY_INSERT PTIS.SubTypeOfUseMaster ON;

;WITH Seed(Id, [Description], TypeOfUseCode, CreatedBy, UpdatedBy, UpdatedDate, SearchKey, SearchSequence,TypeOfUseCategoryId) AS
(
    SELECT * FROM (VALUES
 (1522, N'बँक/वित्तीय संस्था', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1523, N'फुट वेअर शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1524, N'फूटवेअर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1525, N'फूड पॅकिंग अँड हाऊस किपींग', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1526, N'खाजगी अभ्यासिका', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1527, N'खाजगी रुग्णालय', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1528, N'खाजगी शाळा', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1529, N'पिठ गिरणी', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1530, N'पी ओ पी शॉप ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1531, N'पीओपि सीलिंग शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1532, N'पीठ गिरण', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1533, N'पीठ गिरणी', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1534, N'पॉईंट सेंटर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1535, N'पोर्टेबल केबिन गोडाउन', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1536, N'फर्निशिंग', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1537, N'फेर्निशिंग', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1538, N'फर्निशिंग आणि  मट्ट्रेस्सेस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1539, N'फर्निशिंग व मॅट्रेस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1540, N'फर्निशिंग शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1541, N'फ़र्निशिंग शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1542, N'फुर्निशिंग शॉप ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1543, N'फरसण मार्ट', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1544, N'फरसान मार्ट', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1545, N'फरसान विक्री', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1546, N'फरसान शॉप ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1547, N'फूल विक्रेता', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1548, N'फ्लोअर मिल ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1549, N'फळ भाजी दुकान ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1550, N'फळ मार्केट', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1551, N'फळ व भाजी आणि किराणा स्टोअर ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1552, N'फळ विक्री', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1553, N'फळांचे दुकान ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1554, N'फॅशन डिजाइनिंग ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1555, N'फॅशन डिजायनर शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1556, N'फॅसिलिटी मॅनेजमेंट', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1557, N'फाईनान्स', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1558, N'फाईनान्स ऑफिस ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1559, N'फायनन्स', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1560, N'फायनान्स', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1561, N'फ़ायनान्स', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1562, N'फायनान्स सेर्विसेस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1563, N'फार्मा ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1564, N'फार्मा होलसेल ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1565, N'केबल इंटरप्राजेस ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1566, N'कम्प्युटर क्लासेस ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1567, N'कम्प्युटर दुकान', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1568, N'कम्प्युटर पार्ट्स अँड मोबाइल रिपेर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1569, N'कम्प्युटर रिपेयरिंग सेंटर ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1570, N'कम्प्युटर रीपेरिंग ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1571, N'कम्प्युटर शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1572, N'कम्प्युटर सेल्स अँड सर्विसेस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1573, N'केमिकल शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1574, N'केमिस्ट', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1575, N'केमिस्ट व टेशनरी', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1576, N'कर्टन बेडशीट सोफा कोच', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1577, N'करटन शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1578, N'कर्टन शॉप  ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1579, N'करटल', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1580, N'क्रेन स्पेअर पार्ट डीलर्स', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1581, N'कुरिअर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1582, N'कूरिअर ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1583, N'क्रिकेट बॅट शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1584, N'कुरीअर ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1585, N'कुरीयर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1586, N'कुरीयर ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1587, N'क्रोकरी होम अप्लायंसेस टाय अँड गिफ्ट', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1588, N'कलेक्शन', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1589, N'कलेक्शन सेंटर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1590, N'कलर शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1591, N'कलरचे दुकान ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1592, N'क्लास', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1593, N'क्लास/स्टेशनरी झेरॉक्स', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1594, N'क्लासेस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1596, N'क्लिनिकल लॅब', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1597, N'क्लीनिक', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1598, N'क्लोथ वेअर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1599, N'कुशन मेकिंग शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1600, N'कस्ट्म क्लियरन्स ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1601, N'कस्टमर सर्विस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1602, N'कांदा बटाटा व्यापारी', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1603, N'कांदा बटाटा होलसेल ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1604, N'कापड दुकान', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1605, N'कापड शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1606, N'कार गॅरेज', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1607, N'कार डेकोर ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1608, N'कार डेकोरेशन दुकान ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1609, N'कार डिटेलिंग सेंटर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1610, N'कार डीलर ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1611, N'कार डीलर शोरूम', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1612, N'कार बॅटरी शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1613, N'कार बाइक बॅटरी शॉप ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1614, N'कार वॉश सेंटर ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1615, N'कार शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1616, N'कार स्पेअर पार्ट शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1617, N'कार सर्विस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1618, N'कार सोल्यूशन्स ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1619, N'कारपेट आणि वालपेपर सर्विस  ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1620, N'कारपेट व वॉलपेपर शॉप  ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1621, N'कारपेंटर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1622, N'कार्यलय', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1624, N'कार्यालय (गोल्ड लोन )', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1625, N'कार्यालय (वित्तीय संस्था)', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1626, N'कार्यालय(ऑनलाइन एज्युकेशन)', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1627, N'कार्यालय(वित्तीय)', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1628, N'किचन अप्लायेन्सेस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1629, N'किचन ऑक्सेसरीज ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1630, N'किचन ग्रोसरी', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1631, N'किचन स्टुडिओ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1632, N'किचन होम', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1633, N'किड्स क्लिनिक', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1634, N'किड्स वेयर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1635, N'किड्स स्कूल', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1636, N'किरणा ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1637, N'किराणा', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1638, N'किराणा दुकान', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1639, N'किराणा दुकान व स्टेशनरी', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1640, N'किराणा मार्केट', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1641, N'किराणा शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1642, N'किराणा स्टोअर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1643, N'किराणा स्टोअर (मिनीमॉल)', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1644, N'किराणा स्टोअर्स', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1645, N'किराणा स्टोर्स', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1646, N'किराणा सामानाचे दुकान ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1647, N'की मेकर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1648, N'कीचेन इंटेरीअल', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1649, N'कॉ म्यानेजमेंट सर्विर्स', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1650, N'कॉम्प्युटर क्लास', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1651, N'कॉम्प्युटर रिपेरिंग', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1652, N'कॉम्प्युटर शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1653, N'कॉस्टमॅटिक शॉप ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1654, N'कॉस्मॅटिक', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1655, N'कॉस्मेटिक', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1656, N'कॉस्मेटिक  क्रॉकरी', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1657, N'कॉस्मेटिक अँड गिफ्ट शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1658, N'कॉस्मेटिक शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1659, N'कॉस्मेटिक्स', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1660, N'कोचिंग क्लास', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1661, N'कोचिंग क्लासेस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1662, N'कुंटेकर केबिन सेल्स ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1663, N'कंटेनर केबिन', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1664, N'आई केअर सेंटर ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1665, N'कडधान्य गोडाउन ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1666, N'कडधान्य स्टॉक गोडाउन', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1667, N'कुंड्या आणि झाडे विक्री ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1668, N'कन्स्ट्रक्शन', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1669, N'कन्स्ट्रकशन ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1670, N'कन्स्ट्रक्शन ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1671, N'कन्सलटंटींग हाऊस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1672, N'कन्सल्टन्सी', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1673, N'कन्सलटन्सी ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1674, N'कपडे', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1675, N'कपडे विक्री ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1676, N'कपडे शिलाई दुकान', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1677, N'कपड्याचे गोडाउन', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1678, N'कपड्याचे दुकान', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1679, N'कपड्यांच दुकान', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1680, N'कपड्यांचे दुकान', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1681, N'कपड्याचे रेडिमेट दुकान', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1682, N'कपडा', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1683, N'कपडा गोडाउन', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1684, N'कपडा दुकान', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1685, N'कपडा व चप्पल', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1686, N'कपडा व साडीचे दुकान', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1687, N'कपडा शिलाई ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1688, N'कपद्याचे दुकान', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1689, N'अॅडवायजर ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1690, N'अभ्यासिका', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1691, N'अभ्यासिका(खाजगी)', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1692, N'अॅल्युमिनियम वर्क शॉप ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1693, N'अॅल्युमिनियम विंडो (ऑफिस)', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1694, N'असोसिएशन', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1696, N'अॅक्वा शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1697, N'अकाऊंट ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1698, N'अकाऊंट कार्यालय', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1699, N'अग्रीकल्चर लँड सेकंड होम', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1700, N'जिम फिटनेस स्टुडिओ ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1701, N'कंन्स्ट्रक्शन ऑफिस ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1703, N'मेडिकल शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1705, N'जनरल स्टोअर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1706, N'पान शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1707, N'कंपनी/ कारखाने नवीन ना हरकत दाखले', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1708, N'पेट्रोल  पंप नुतनिकरण ना हरकत दाखला', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1709, N'नवीन उद्योगधंदा परवाना', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1710, N'नवीन व्यवसाय परवाना देणे', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1711, N'व्यवसाय परवाना नुतनीकरण', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1712, N'साठा परवाना नुतनीकरण ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1713, N'आटा चक्की', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1714, N'आय ग्लास', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1715, N'आयुरयोगा सेंटर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1716, N'आयुर्वेदिक दुकान', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1717, N'आयुर्वेदिक मेडिकल', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1718, N'आयुर्वेदिक व युनाणी हब', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1719, N'आयुर्वेदिक सेंटर व साडी सेंटर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1720, N'आर्किटेक कार्यालय', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1721, N'आर्किटेक्चर ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1722, N'आर्ट क्राफ्ट', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1723, N'आर्युवेदिक स्टोअर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1724, N'इजिनियरिंग ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1725, N'इंजीनिअरिंग ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1726, N'इंजीनिअरिंग कंपनी ( ऑफिस)', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1727, N'इंटरनेट ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1728, N'इंटरनेट सर्व्हिसेस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1729, N'इंटरप्राइझेस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1730, N'इंटेरियर डिझायनिंग', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1731, N'इंटेरियर डिसायनीग ऑफिस ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1732, N'इंटेरियल ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1733, N'इंटेरीअर डिजायनर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1734, N'इंडस्ट्रीज सर्विसेस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1735, N'इनवटर बॅटरी ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1736, N'इन्वटर बॅटरी विक्री', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1737, N'इनवेसमेंट कार्यालय', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1738, N'इन्शुरन्स ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1739, N'इन्शुरन्स ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1740, N'इन्शुरन्स कं. लि.', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1741, N'इलेक्ट्रिक', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1742, N'इलेक्ट्रिक अँड हार्डवेअर शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1743, N'इलेक्ट्रिक अँड हार्डवेर ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1744, N'इलेक्ट्रिक आणि हार्डवेअर ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1745, N'इलेक्ट्रिक बाइक शोरूम', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1746, N'इलेक्ट्रिक रिपेअरींग शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1747, N'इलेक्ट्रिक रिपेरिंग', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1748, N'इलेक्ट्रिक रीपेरिंग', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1749, N'इलेक्ट्रिक लाइट ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1750, N'इलेक्ट्रिक व हार्डवेअर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1751, N'इलेक्ट्रिक वस्तु विक्री', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1752, N'इलेक्ट्रिक शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1753, N'इलेक्ट्रिक स्कूटर विक्री', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1754, N'इलेक्ट्रिक सामान दुरूस्ती', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1755, N'इलेक्ट्रिक हार्डवेअर ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1756, N'इलेक्ट्रिक हार्डवेअर स्टोअर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1757, N'इलेक्ट्रिकल', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1758, N'इलेक्ट्रिकल अँड हार्डवेअर ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1759, N'इलेक्ट्रिकल्स', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1760, N'इलेक्ट्रिकल्स अँड हार्डवेअर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1761, N'इलेक्ट्रिक्स अँड हार्डवेअर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1762, N'इलेक्ट्रॉनिक शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1763, N'इलेक्ट्रॉनिक्स', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1764, N'इलेक्ट्रॉनिक्स  रीपेअरिंग शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1765, N'इलेक्टीक्लर्स', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1766, N'इंशुरंस सल्लागार', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1767, N'इंस्टीट्यूट', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1768, N'इस्त्री', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1769, N'ईलेक्ट्रिशन', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1770, N'उस सप्लायर्स ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1772, N'एक्सिस बँक  ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1773, N'एजेंट ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1774, N'एजन्सी ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1775, N'एंजिनियर ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1776, N'एंटरप्रायजेस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1777, N'एटीएम', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1778, N'एड्वोकेट ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1779, N'एम.एस.पाईप गोडाउन ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1780, N'एम्ब्रोइडरी', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1781, N'एल आय सी  फायनान्स', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1782, N'एल आय सी कार्यालय', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1783, N'एल.आय.सी. ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1784, N'एलेक्ट्रोनिक स्टोर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1785, N'एलुमिनियम अँड ग्लास वर्क', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1786, N'एव्हेंट एजन्सि', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1787, N'एसी रेर्पैरिंग', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1788, N'एसी रिपेरिंग', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1789, N'ऑइल शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1790, N'ऑटो गॅरेज', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1791, N'ऑटो पार्ट्स आणि सर्विस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1792, N'ऑटोमोबाइल', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1793, N'ऑटोमोबाइल पार्ट सर्विसेस ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1794, N'ऑटोमोबाइल रीपेयरिंग शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1795, N'ऑटोमोबाइल शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1796, N'ऑटोमोबाइल स्पेअरपार्ट शॉप ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1797, N'ऑटोमोबाईल अँड वॉशिंग सेंटर', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1798, N'ऑटोमोबाईल शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1799, N'ऑनलाइन ग्रोसरी', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1800, N'ऑनलाइन ग्रोसरी डेलिवेरी', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1801, N'ऑनलाइन शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1802, N'ऑप्टिक', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1803, N'ऑप्टिक शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1804, N'ऑप्टिकल', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1805, N'ऑप्टिकल शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1806, N'ऑप्टिकल्स शॉप ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1807, N'ऑप्टिक्स', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1808, N'ऑप्टिक्स शॉप', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1809, N'ऑफिस ( कनस्टटसी ऑफिस )', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1810, N'ऑफिस + स्टेशनरी', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1811, N'ऑफिस लॉजिस्टिक्स सेर्विसेस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1812, N'ओपटीकल्स ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1813, N'ओल्ड पेपर मार्ट', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1814, N'औषद विक्री', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1815, N'उद्योगधंदा परवाना नुतनीकरण  ', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1816, N'( अग्रो प्रोडक्ट )ऑफिस', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1821, N'आईस्क्रीम पार्लर', N'S', 68, NULL, NULL, N'', 0, NULL),
  (1822, N'एनजीओ', N'S', 68, NULL, NULL, N'', 0, NULL),
  (1823, N'योगा ', N'GM', 68, NULL, NULL, N'', 0, NULL),
  (1824, N'झुंबा ', N'GM', 68, NULL, NULL, N'', 0, NULL),
  (1826, N'वस्तु निर्मिती', N'S', NULL, NULL, NULL, N'', 0, NULL),
  (1828, N'पार्कींग', N'N', 72, NULL, NULL, N'', 0, NULL),
  (1829, N'रिफ्युज एरिया', N'N', 72, NULL, NULL, N'', 0, NULL),
  (1830, N'पार्किंग', N'GR', 70, NULL, NULL, N'', 0, 1),
  (1831, N'पेट्स क्लिनिक', N'D', 68, NULL, NULL, N'', 0, NULL),
  (1832, N'विद्यालय', N'T', 72, NULL, NULL, N'', 0, NULL),
  (1835, N'औद्योगिक', N'NI', 66, NULL, NULL, N'', 0, NULL),
  (1836, N'इंडेक्स-2', N'C', 74, NULL, NULL, N'', 0, NULL),
  (1854, N'स्टोअर रूम', N'R', 72, NULL, NULL, N'', 0, NULL),
  (1932, N'Other', N'ABLC', NULL, NULL, NULL, N'', 0, NULL),
  (2012, N'व्हिजिटर्स पार्किंग', N'SPK', NULL, NULL, NULL, N'', 0, 1),
  (2013, N'कार पार्किंग', N'OPK', NULL, NULL, NULL, N'', 0, 1),
  (2015, N'सायकल  पार्किंग ', N'OPK', NULL, NULL, NULL, N'', 0, 1),
  (2019, N'बाईक पार्किंग', N'OPKC', NULL, NULL, NULL, N'', 0, 1),
  (2026, N'लॉबी', N'ACH', 91, NULL, NULL, N'', 0, NULL),
  (2028, N'वॉचमन रूम', N'ACH', 91, NULL, NULL, N'', 0, NULL),
  (2030, N'बॅडमिंटन कोर्ट', N'ACH', 91, NULL, NULL, N'', 0, NULL),
  (2032, N'चेस एरिया', N'ACH', 91, NULL, NULL, N'', 0, NULL),
  (2034, N'कॅरम एरिया', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2036, N'पंप रूम', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2038, N'आरएमएस रूम', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2040, N'इलेक्ट्रिक रूम', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2042, N'गोडाऊन', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2044, N'रेस्टॉरंट', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2046, N'डिपार्टमेंटल स्टोअर', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2048, N'बँक्वेट हॉल', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2050, N'क्रेच', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2054, N'टेबल टेनिस एरिया', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2056, N'स्नूकर / अॅडमिन एरिया', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2059, N'ए.व्ही. रूम', N'ACHC', 56, NULL, NULL, N'', 0, NULL),
  (2060, N'जेन्ट्स टॉयलेट', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2063, N'कॉमन वॉशरूम', N'ACHC', 56, NULL, NULL, N'', 0, NULL),
  (2065, N'हँडीकॅप वॉशरूम', N'ACHC', 56, NULL, NULL, N'', 0, NULL),
  (2066, N'लेडीज वॉशरूम', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2068, N'स्विमिंग पूल', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2070, N'एल.व्ही.एस. रूम', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2072, N'फिटनेस सेंटर', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2074, N'कॅफेटेरिया', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2076, N'सोसायटी रूम', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2078, N'ड्रायव्हर रूम', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2080, N'गेस्ट रूम', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2082, N'रेस्ट रूम & चेंजिंग रूम', N'ACH', 56, NULL, NULL, N'', 0, NULL),
  (2084, N'जानिटर रूम', N'ACH', 56, NULL, NULL, N'', 0, NULL)

   ) v(Id, [Description], TypeOfUseCode, CreatedBy, UpdatedBy, UpdatedDate, SearchKey, SearchSequence,TypeOfUseCategoryId)
)
INSERT PTIS.SubTypeOfUseMaster
(Id, [Description], TypeOfUseId, CreatedBy, UpdatedBy, UpdatedDate, SearchSequence,TypeOfUseCategoryId)
SELECT
    s.Id,
    s.[Description],
    t.Id,          
    s.CreatedBy,
    s.UpdatedBy,
    s.UpdatedDate,
    s.SearchSequence,
    s.TypeOfUseCategoryId
FROM Seed s
JOIN PTIS.TypeOfUseMaster t
  ON t.TypeOfUseCode = s.TypeOfUseCode;

SET IDENTITY_INSERT PTIS.SubTypeOfUseMaster OFF;





INSERT INTO [PTIS].[OwnerTypeMaster] ([OwnerType])
VALUES
('Self'),
('Women'),
('Soldier'),
('Ex. Militry Soldier'),
('Martyr Soldier'),
('Martyr Soldier Wife'),
('Joined'),
('Company / Industrial'),
('Physical Disability');






SET IDENTITY_INSERT [PTIS].[PropertyTypeCategoryMaster] ON;
INSERT INTO [PTIS].[PropertyTypeCategoryMaster] ([Id], [PropertyTypeCategory], [isActive]) VALUES ('2',N'निवासी','1');
INSERT INTO [PTIS].[PropertyTypeCategoryMaster] ([Id], [PropertyTypeCategory], [isActive]) VALUES ('3',N'अनिवासी','1');
INSERT INTO [PTIS].[PropertyTypeCategoryMaster] ([Id], [PropertyTypeCategory], [isActive]) VALUES ('4',N'शासकीय मालमत्ता','1');
INSERT INTO [PTIS].[PropertyTypeCategoryMaster] ([Id], [PropertyTypeCategory], [isActive]) VALUES ('5',N'शैक्षणिक','1');
INSERT INTO [PTIS].[PropertyTypeCategoryMaster] ([Id], [PropertyTypeCategory], [isActive]) VALUES ('6',N'औद्योगिक','1');
INSERT INTO [PTIS].[PropertyTypeCategoryMaster] ([Id], [PropertyTypeCategory], [isActive]) VALUES ('7',N'मिश्रित','1');
SET IDENTITY_INSERT [PTIS].[PropertyTypeCategoryMaster] OFF;




SET IDENTITY_INSERT [PTIS].[PropertyTypeMaster] ON;

INSERT INTO [PTIS].[PropertyTypeMaster]
(
 [Id],
 [PropertyDescription],
 [PropertyDescriptionEnglish],
 [Type],
 [SearchSequence],
 [PropertyTypeCategoryId],
 [PartType],
 [IsActive]
)
VALUES
(1,N'खाजगी शाळा',N'Private School', N'C',1, NULL, N'C',1),
(2,N'म.न.पा.शाळा',N'Municipal Corporation School', N'N',1, NULL, N'',1),
(5,N'खाजगी रुग्णालय',N'Private Hospital',N'C',1, NULL, N'C',1),
(6,N'शासकीय रुग्णालय',N'Government Hospital',N'C',2, NULL, N'C',1),
(8,N'म.न.पा.चे रुग्णालय',N'Municipal Corporation Hospital', N'N',4, NULL, N'',1),
(10,N'बँक व वित्तीय संस्था',N'Bank and Financial Institution', N'C',1, NULL, N'C',1),
(11,N'धार्मिक स्थळ',N'Religious Place',N'R',1, NULL, N'R',1),
(12,N'निवासी',N'Residential',N'R',1, 2, N'R',1),
(13,N'दुकान', N'Shop',N'C',1, NULL, N'C',1),
(14,N'रेस्टॉरंट आणि बार',N'Restaurant and Bar',N'C',1, NULL, N'C',1),
(16,N'म.न.पा.चे.कार्यालय',N'Municipal Corporation Office', N'N',2, NULL, N'',1),
(17,N'शासकीय कार्यालय',N'Government Office', N'C',3, NULL, N'C',1),
(21,N'म.न.पा. व इतर मालमत्ता',N'Municipal Corporation and Other Property', N'N', 2, NULL, N'',1),
(22,N'प्लॉट',N'Plot',N'R',1, NULL, N'R',1),
(23,N'निवासी व दुकान', N'Residential and Shop',N'R-C', 2, NULL, N'',1),
(24,N'अतिक्रमण',N'Encroachment',N'R',3, NULL, N'R',1),
(25,N'मा शासकीय मालमत्ता',N'Government Property',N'C',4, NULL, N'C',1),
(27,N'मोबाईल टॉवर',N'Mobile Tower',N'C',2, NULL, N'C',1),
(28,N'पेट्रोल पंप',N'Petrol Pump',N'C',1, NULL, N'C',1),
(29,N'हॉटेल', N'Hotel', N'C',2, NULL, N'C',1),
(30,N'लॉज',N'Lodge', N'C',1, NULL, N'C',1),
(31,N'निवासी व हॉटेल',N'Residential and Hotel', N'R-C', 4, NULL, N'',1),
(32,N'गोडाऊन',N'Godown',N'C',2, NULL, N'C',1),
(33,N'चालू बांधकाम',N'Under Construction',N'R',1, NULL, N'R',1),
(34,N'गोठा',N'Cattle Shed',N'R',5, NULL, N'R',1),
(35,N'पडीत',N'Vacant / Dilapidated',N'R',6, NULL, N'R',1),
(36,N'कार्यालय',N'Office',N'C',2, NULL, N'C',1),
(37,N'म.न.पा.दुकान गाळे', N'Municipal Corporation Shop Units',N'N',4, NULL, N'',1),
(38,N'वसतिगृह', N'Hostel',N'C',2, NULL, N'C',1),
(39,N'व्यायाम शाळा',N'Gymnasium',N'C',5, NULL, N'C',1),
(41,N'पार्किंग',N'Parking',N'C',2, NULL, N'C',1),
(42,N'निवासी व कार्यालय',N'Residential and Office',N'R-C', 8, NULL, N'',1),
(44,N'वाचनालय', N'Library',N'C',2, NULL, N'C',1),
(45,N'केंद्र शासकीय मालमत्ता', N'Central Government Property',N'C',1, NULL, N'C',1),
(46,N'खाजगी रुग्णालय व निवासी',N'Private Hospital and Residential',N'R-C', 5, NULL, N'',1),
(47,N'धार्मिक स्थळ व अनिवासी', N'Religious Place and Non-Residential', N'R-C', 3, NULL, N'',1),
(48,N'शासकीय वसतिगृह',N'Government Hostel', N'C',7, NULL, N'C',1),
(49,N'लॉंन',N'Lawn',N'C',3, NULL, N'C',1),
(50,N'चित्रपटगृह', N'Cinema Theatre',N'C',4, NULL, N'C',1),
(51,N'शोरूम', N'Showroom', N'C',4, NULL, N'C',1),
(52,N'कोचिंग क्लासेस', N'Coaching Classes',N'C',2, NULL, N'C',1),
(53,N'खाजगी रुग्णालय व दुकान',N'Private Hospital and Shop', N'C',7, NULL, N'C',1),
(54,N'मंगल कार्यालय व निवासी', N'Marriage Hall and Residential',N'R-C', 2, NULL, N'',1),
(55,N'निवासी व औद्योगिक', N'Residential and Industrial',N'R-C', 2, NULL, N'',1),
(57,N'दुकान व पडीत',N'Shop and Vacant',N'R-C', 5, NULL, N'',1),
(58,N'निवासी व पडीत', N'Residential and Vacant',N'R',10, NULL, N'R',1),
(59,N'निवासीव बँक', N'Residential and Bank',N'R-C', 2, NULL, N'',1),
(63,N'खाजगी शाळा व निवासी',N'Private School and Residential', N'R-C', 2, NULL, N'',1),
(64,N'दुकान व मंगल कार्यालय', N'Shop and Marriage Hall',N'C',6, NULL, N'C',1),
(66,N'दुकान व कार्यालय',N'Shop and Office',N'C',3, NULL, N'C',1),
(69,N'निवासी व अनिवासी',N'Residential and Non-Residential',N'R-C', 6, NULL, N'',1),
(70,N'कारखाना व कार्यालय',N'Factory and Office',N'C',3, NULL, N'C',1),
(77,N'दवाखाना व हॉटेल',N'Clinic and Hotel',N'C',10, NULL, N'C',1),
(78,N'बँक व अनिवासी', N'Bank and Non-Residential',N'C',6, NULL, N'C',1),
(79,N'हॉटेल व दुकान', N'Hotel and Shop',N'C',6, NULL, N'C',1),
(80,N'निवासी,गोडाउन,दुकान',N'Residential, Godown and Shop', N'R-C', 8, NULL, N'',1),
(82,N'अनिवासी', N'Non-Residential',N'C',2, NULL, N'C',1),
(83,N'कारखाना व गोडाउन',N'Factory and Godown',N'C',4, NULL, N'C',1),
(88,N'शैक्षणिक शासकीय',N'Government Educational',N'C',4, NULL, N'C',1),
(92,N'औद्योगिक',N'Industrial', N'I',1, NULL, N'',1),
(94,N'मॉल',N'Mall',N'C',3, NULL, N'C',1),
(108, N'शासकीय मालमत्ता',N'Government Property',N'C',5, NULL, N'C',1),
(110, N'धार्मिक स्थळ व निवासी',N'Religious Place and Residential',N'R',1, NULL, N'R',1),
(111, N'निवासी व गोडावून',N'Residential and Godown',N'R-C', 1, NULL, N'',1),
(113, N'मंगल कार्यालय',N'Marriage Hall', N'C',1, NULL, N'C',1),
(115, N'निवासी व कोचिंग क्लासेस',N'Residential and Coaching Classes',N'R-C', 1, NULL, N'',1),
(118, N'अंगणवाडी',N'Anganwadi',N'C',1, NULL, N'C',1),
(119, N'निवासी व अंगणवाडी', N'Residential and Anganwadi', N'R-C', 1, NULL, N'',1),
(127, N'गोडावून व दुकान',N'Godown and Shop',N'C',1, NULL, N'C',1),
(132, N'शेती',N'Agricultural Land', N'R',1, NULL, N'R',1),
(133, N'मोबाईल टॉवर व निवासी',N'Mobile Tower and Residential', N'R-C', 1, NULL, N'',1),
(134, N'सामाजिक सभागृह', N'Community Hall',N'C',1, NULL, N'C',1),
(135, N'मनपा गार्डन/ओपनस्पेस',N'Municipal Garden / Open Space',N'C',1, NULL, N'C',1),
(136, N'मनपा इतर भूखंड', N'Other Municipal Plot',N'R',1, NULL, N'R',1),
(137, N'नर्सरी',N'Nursery',N'C',1, NULL, N'C',1),
(138, N'पेयिंग गेस्ट',N'Paying Guest',N'R',1, NULL, N'R',1),
(139, N'पॅथॉलॉजी लॅब',N'Pathology Lab', N'C',1, NULL, N'C',1),
(140, N'अॅमिनीटी',N'Amenity',N'R',1, NULL, N'Amenity', 1),
(141, N'रिफ्युज एरिया',N'Refuge Area',N'N',1, NULL, N'',1),
(142, N'निवासी व चालू बांधकाम', N'Residential and Under Construction',N'R',1, NULL, N'R',1),
(144, N'पोल्ट्रीफार्म',N'Poultry Farm',N'C',1, NULL, N'C',1),
(145, N'अनिवासी व चालू बांधकाम',N'Non-Residential and Under Construction', N'R-C', 1, NULL, N'',1),
(146, N'निवासी व गोठा', N'Residential and Cattle Shed',N'R',1, NULL, N'R',1),
(147, N'प्लॉट व अनिवासी',N'Plot and Non-Residential',N'C',1, NULL, N'C',1),
(148, N'निवासी व खुला भूखंड',N'Residential and Open Plot', N'R',1, NULL, N'R',1),
(149, N'अनिवासी व खुला भूखंड',N'Non-Residential and Open Plot',N'C',1, NULL, N'C',1),
(151, N'औद्योगिक व अनिवासी',N'Industrial and Non-Residential', N'I-C', 1, NULL, N'',1),
(152, N'औद्योगिक व मिश्र',N'Industrial and Mixed Use',N'R-C', 1, NULL, N'',1),
(153, N'निवासी , औद्यागिक , अनिवासी',N'Residential, Industrial and Non-Residential', N'R-C', 1, NULL, N'', 1),
(154, N'निवासी व वाचनालय',N'Residential and Library',N'R-C', 1, NULL, N'',1),
(155, N'बांधकाम पूर्ण मा. वापरात नाही',N'Construction Completed but Not in Use',N'R-C', 1, NULL, N'',1),
(156, N'शेती व अनिवासी',N'Agricultural and Non-Residential',N'R-C', 1, NULL, N'',1),
(157, N'क्लिनिक', N'Clinic',N'C',1, NULL, N'C',1),
(158, N'उपहारगृह',N'Restaurant', N'C',1, NULL, N'C',1),
(159, N'धार्मिक स्थळ,निवासी व अनिवासी', N'Religious Place, Residential and Non-Residential', N'R-C', 1, NULL, N'', 1),
(160, N'माहिती व तंत्रज्ञान उद्योग',N'Information Technology Industry',N'I',1, NULL, N'',1),
(161, N'सामाजिक संस्था', N'Social Institution',N'R',1, NULL, N'R',1);

SET IDENTITY_INSERT [PTIS].[PropertyTypeMaster] OFF;

/* ============================================================
   1. PTIS.FLatGenerationGroupMaster
   ============================================================ */
 
SET IDENTITY_INSERT [PTIS].[FLatGenerationGroupMaster] ON;
GO
 
INSERT INTO [PTIS].[FLatGenerationGroupMaster]
(
    [Id],
    [FLatGenerationGroup],
    [IsActive]
)
VALUES
(1, N'UPPER',     1),
(2, N'GENERAL',   1),
(3, N'OPENPLOT',  1),
(4, N'PODIUM',    1),
(5, N'MEZZANINE', 1),
(6, N'LOWER',     1),
(7, N'BASEMENT',  1);
GO
 
SET IDENTITY_INSERT [PTIS].[FLatGenerationGroupMaster] OFF;
GO
 
 
/* ============================================================
   2. PTIS.FloorMaster
 
   FLatGenerationGroupId Mapping:
   1 = UPPER
   2 = GENERAL
   3 = OPENPLOT
   4 = PODIUM
   5 = MEZZANINE
   6 = LOWER
   7 = BASEMENT
 
   Display Order:
   M, B, L, G, U1, U2, P1-P20, 1-70, OP
 
   Total Floor Records: 97
   ============================================================ */
 
SET IDENTITY_INSERT [PTIS].[FloorMaster] ON;
GO
 
INSERT INTO [PTIS].[FloorMaster]
(
    [Id],
    [FloorCode],
    [Description],
    [DescriptionEnglish],
    [SequenceNo],
    [MaxFloorNo],
    [FLatGenerationGroupId],
    [FLatGenerationSeq],
    [IsProtected]
)
VALUES
 
/* ============================================================
   SPECIAL FLOORS
   ============================================================ */
 
(4,  N'M',  N'पोटमाळा', N'Mezzanine Floor', 0, 4, 5, 1, 1),
(1,  N'B',  N'तळघर', N'Basement', 1, 1, 7, 1, 1),
(3,  N'L',  N'लोअर तळमजला', N'Lower Ground Floor', 2, 3, 6, 1, 1),
(2,  N'G',  N'तळमजला', N'Ground Floor', 3, 2, 2, 1, 1),
(11, N'U1', N'अप्पर ग्राऊंड पहिला', N'Upper Ground First', 4, 11, 1, 1, 1),
(12, N'U2', N'अप्पर ग्राऊंड दुसरा', N'Upper Ground Second', 5, 12, 1, 2, 1),
 
/* ============================================================
   PODIUM FLOORS P1 - P20
   ============================================================ */
 
(5,  N'P1',  N'पोडियम1',  N'Podium 1',  6,  5,    4, 1, 1),
(6,  N'P2',  N'पोडियम2',  N'Podium 2',  7,  6,    4, 2, 1),
(7,  N'P3',  N'पोडियम3',  N'Podium 3',  8,  7,    4, 3, 1),
(8,  N'P4',  N'पोडियम4',  N'Podium 4',  9,  8,    4, 4, 1),
(9,  N'P5',  N'पोडियम5',  N'Podium 5', 10,  9,    4, 5, 1),
(10, N'P6',  N'पोडियम6',  N'Podium 6', 11, 10,    4, 6, 1),
(84, N'P7',  N'पोडियम7',  N'Podium 7', 12, NULL,  4, 7, 1),
(85, N'P8',  N'पोडियम8',  N'Podium 8', 13, NULL,  4, 8, 1),
(86, N'P9',  N'पोडियम9',  N'Podium 9', 14, NULL,  4, 9, 1),
(87, N'P10', N'पोडियम10', N'Podium 10',15, NULL, 4,10, 1),
(88, N'P11', N'पोडियम11', N'Podium 11',16, NULL, 4,11, 1),
(89, N'P12', N'पोडियम12', N'Podium 12',17, NULL, 4,12, 1),
(90, N'P13', N'पोडियम13', N'Podium 13',18, NULL, 4,13, 1),
(91, N'P14', N'पोडियम14', N'Podium 14',19, NULL, 4,14, 1),
(92, N'P15', N'पोडियम15', N'Podium 15',20, NULL, 4,15, 1),
(93, N'P16', N'पोडियम16', N'Podium 16',21, NULL, 4,16, 1),
(94, N'P17', N'पोडियम17', N'Podium 17',22, NULL, 4,17, 1),
(95, N'P18', N'पोडियम18', N'Podium 18',23, NULL, 4,18, 1),
(96, N'P19', N'पोडियम19', N'Podium 19',24, NULL, 4,19, 1),
(97, N'P20', N'पोडियम20', N'Podium 20',25, NULL, 4,20, 1),
 
/* ============================================================
   REGULAR FLOORS 1 - 70
 
   SequenceNo = Floor Number + 25
   FLatGenerationSeq = Floor Number + 1
   FLatGenerationGroupId = 2 (GENERAL)
   ============================================================ */
 
(13, N'1',  N'पहिला मजला', N'First Floor', 26, 13, 2, 2, 1),
(14, N'2',  N'दुसरा मजला', N'Second Floor', 27, 14, 2, 3, 1),
(15, N'3',  N'तिसरा मजला', N'Third Floor', 28, 15, 2, 4, 1),
(16, N'4',  N'चौथा मजला', N'Fourth Floor', 29, 16, 2, 5, 1),
(17, N'5',  N'पाचवा मजला', N'Fifth Floor', 30, 17, 2, 6, 1),
(18, N'6',  N'सहावा मजला', N'Sixth Floor', 31, 18, 2, 7, 1),
(19, N'7',  N'सातवा मजला', N'Seventh Floor', 32, 19, 2, 8, 1),
(20, N'8',  N'आठवा मजला', N'Eighth Floor', 33, 20, 2, 9, 1),
(21, N'9',  N'नववा मजला', N'Ninth Floor', 34, 21, 2, 10, 1),
(22, N'10', N'दहावा मजला', N'Tenth Floor', 35, 22, 2, 11, 1),
(23, N'11', N'अकरावा मजला', N'Eleventh Floor', 36, 23, 2, 12, 1),
(24, N'12', N'बारावा मजला', N'Twelfth Floor', 37, 24, 2, 13, 1),
(25, N'13', N'तेरावा मजला', N'Thirteenth Floor', 38, 25, 2, 14, 1),
(26, N'14', N'चौदावा मजला', N'Fourteenth Floor', 39, 26, 2, 15, 1),
(27, N'15', N'पंधरावा मजला', N'Fifteenth Floor', 40, 27, 2, 16, 1),
(28, N'16', N'सोळावा मजला', N'Sixteenth Floor', 41, 28, 2, 17, 1),
(29, N'17', N'सतरावा मजला', N'Seventeenth Floor', 42, 29, 2, 18, 1),
(30, N'18', N'अठरावा मजला', N'Eighteenth Floor', 43, 30, 2, 19, 1),
(31, N'19', N'एकोणिसावा मजला', N'Nineteenth Floor', 44, 31, 2, 20, 1),
(32, N'20', N'विसावा मजला', N'Twentieth Floor', 45, 32, 2, 21, 1),
(33, N'21', N'एकविसावा मजला', N'Twenty-First Floor', 46, 33, 2, 22, 1),
(34, N'22', N'बाविसावा मजला', N'Twenty-Second Floor', 47, 34, 2, 23, 1),
(35, N'23', N'तेविसावा मजला', N'Twenty-Third Floor', 48, 35, 2, 24, 1),
(36, N'24', N'चोविसावा मजला', N'Twenty-Fourth Floor', 49, 36, 2, 25, 1),
(37, N'25', N'पंचविसावा मजला', N'Twenty-Fifth Floor', 50, 37, 2, 26, 1),
(38, N'26', N'सव्विसावा मजला', N'Twenty-Sixth Floor', 51, 38, 2, 27, 1),
(39, N'27', N'सत्ताविसावा मजला', N'Twenty-Seventh Floor', 52, 39, 2, 28, 1),
(40, N'28', N'अठ्ठाविसावा मजला', N'Twenty-Eighth Floor', 53, 40, 2, 29, 1),
(41, N'29', N'एकोणतिसावा मजला', N'Twenty-Ninth Floor', 54, 41, 2, 30, 1),
(42, N'30', N'तिसावा मजला', N'Thirtieth Floor', 55, 42, 2, 31, 1),
(43, N'31', N'एकतिसावा मजला', N'Thirty-First Floor', 56, 43, 2, 32, 1),
(44, N'32', N'बत्तिसावा मजला', N'Thirty-Second Floor', 57, 44, 2, 33, 1),
(45, N'33', N'तेत्तिसावा मजला', N'Thirty-Third Floor', 58, 45, 2, 34, 1),
(46, N'34', N'चौतिसावा मजला', N'Thirty-Fourth Floor', 59, 46, 2, 35, 1),
(47, N'35', N'पस्तिसावा मजला', N'Thirty-Fifth Floor', 60, 47, 2, 36, 1),
(48, N'36', N'छत्तिसावा मजला', N'Thirty-Sixth Floor', 61, 48, 2, 37, 1),
(49, N'37', N'सदतिसावा मजला', N'Thirty-Seventh Floor', 62, 49, 2, 38, 1),
(50, N'38', N'अडतिसावा मजला', N'Thirty-Eighth Floor', 63, 50, 2, 39, 1),
(51, N'39', N'एकोणचाळिसावा मजला', N'Thirty-Ninth Floor', 64, 51, 2, 40, 1),
(52, N'40', N'चाळिसावा मजला', N'Fortieth Floor', 65, 52, 2, 41, 1),
(53, N'41', N'एकेचाळिसावा मजला', N'Forty-First Floor', 66, 53, 2, 42, 1),
(54, N'42', N'बेचाळिसावा मजला', N'Forty-Second Floor', 67, 54, 2, 43, 1),
(55, N'43', N'त्रेचाळिसावा मजला', N'Forty-Third Floor', 68, 55, 2, 44, 1),
(56, N'44', N'चौचाळिसावा मजला', N'Forty-Fourth Floor', 69, 56, 2, 45, 1),
(57, N'45', N'पंचेचाळिसावा मजला', N'Forty-Fifth Floor', 70, 57, 2, 46, 1),
(58, N'46', N'सेहेचाळिसावा मजला', N'Forty-Sixth Floor', 71, 58, 2, 47, 1),
(59, N'47', N'सत्तेचाळिसावा मजला', N'Forty-Seventh Floor', 72, 59, 2, 48, 1),
(60, N'48', N'अठ्ठेचाळिसावा मजला', N'Forty-Eighth Floor', 73, 60, 2, 49, 1),
(61, N'49', N'एकोणपन्नासावा मजला', N'Forty-Ninth Floor', 74, 61, 2, 50, 1),
(62, N'50', N'पन्नासावा मजला', N'Fiftieth Floor', 75, 62, 2, 51, 1),
(63, N'51', N'एकावन्नावा मजला', N'Fifty-First Floor', 76, 63, 2, 52, 1),
(64, N'52', N'बावन्नावा मजला', N'Fifty-Second Floor', 77, 64, 2, 53, 1),
(65, N'53', N'त्रेपन्नावा मजला', N'Fifty-Third Floor', 78, 65, 2, 54, 1),
(66, N'54', N'चौपन्नावा मजला', N'Fifty-Fourth Floor', 79, 66, 2, 55, 1),
(67, N'55', N'पंचावन्नावा मजला', N'Fifty-Fifth Floor', 80, 67, 2, 56, 1),
(68, N'56', N'छप्पन्नावा मजला', N'Fifty-Sixth Floor', 81, 68, 2, 57, 1),
(69, N'57', N'सत्तावन्नावा मजला', N'Fifty-Seventh Floor', 82, 69, 2, 58, 1),
(70, N'58', N'अठ्ठावन्नावा मजला', N'Fifty-Eighth Floor', 83, 70, 2, 59, 1),
(71, N'59', N'एकोणसाठावा मजला', N'Fifty-Ninth Floor', 84, 71, 2, 60, 1),
(72, N'60', N'साठावा मजला', N'Sixtieth Floor', 85, 72, 2, 61, 1),
(73, N'61', N'एकसष्टावा मजला', N'Sixty-First Floor', 86, 73, 2, 62, 1),
(74, N'62', N'बासष्टावा मजला', N'Sixty-Second Floor', 87, 74, 2, 63, 1),
(75, N'63', N'त्रेसष्टावा मजला', N'Sixty-Third Floor', 88, 75, 2, 64, 1),
(76, N'64', N'चौसष्टावा मजला', N'Sixty-Fourth Floor', 89, 76, 2, 65, 1),
(77, N'65', N'पासष्टावा मजला', N'Sixty-Fifth Floor', 90, 77, 2, 66, 1),
(78, N'66', N'सहासष्टावा मजला', N'Sixty-Sixth Floor', 91, 78, 2, 67, 1),
(79, N'67', N'सदुसष्टावा मजला', N'Sixty-Seventh Floor', 92, 79, 2, 68, 1),
(80, N'68', N'अडुसष्टावा मजला', N'Sixty-Eighth Floor', 93, 80, 2, 69, 1),
(81, N'69', N'एकोणसत्तरावा मजला', N'Sixty-Ninth Floor', 94, 81, 2, 70, 1),
(82, N'70', N'सत्तरावा मजला', N'Seventieth Floor', 95, 82, 2, 71, 1),
 
/* ============================================================
   OPEN PLOT - LAST RECORD
   ============================================================ */
 
(83, N'OP', N'Open Plot', N'Open Plot', 97, 0, 3, 1, 1);
 
GO
 
SET IDENTITY_INSERT [PTIS].[FloorMaster] OFF;
GO

;WITH Seed(FloorCode, FactorWithLift, FactorWithoutLift, CreatedBy, UpdatedBy, UpdatedDate) AS
(
    SELECT * FROM (VALUES
      (N'G', 1.00, 1.00, NULL, NULL, NULL),
      (N'1', 1.00, 1.00, NULL, NULL, NULL),
      (N'2', 1.00, 1.00, NULL, NULL, NULL),
      (N'3', 1.00, 1.00, NULL, NULL, NULL),
      (N'4', 1.00, 1.00, NULL, NULL, NULL),
      (N'5', 1.00, 1.00, NULL, NULL, NULL),
      (N'6', 1.00, 1.00, NULL, NULL, NULL),
      (N'7', 1.00, 1.00, NULL, NULL, NULL),
      (N'8', 1.00, 1.00, NULL, NULL, NULL),
      (N'B', 1.00, 1.00, NULL, NULL, NULL),
      (N'9', 1.00, 1.00, NULL, NULL, NULL),
      (N'10',1.00, 1.00, NULL, NULL, NULL),
      (N'11',1.00, 1.00, NULL, NULL, NULL),
      (N'12',1.00, 1.00, NULL, NULL, NULL),
      (N'13',1.00, 1.00, NULL, NULL, NULL),
      (N'14',1.00, 1.00, NULL, NULL, NULL),
      (N'M', 1.00, 1.00, NULL, NULL, NULL),
      (N'15',1.00, 1.00, NULL, NULL, NULL),
      (N'16',1.00, 1.00, NULL, NULL, NULL),
      (N'17',1.00, 1.00, NULL, NULL, NULL),
      (N'18',1.00, 1.00, NULL, NULL, NULL),
      (N'19',1.00, 1.00, NULL, NULL, NULL),
      (N'20',1.00, 1.00, NULL, NULL, NULL),
      (N'21',1.00, 1.00, NULL, NULL, NULL),
      (N'22',1.00, 1.00, NULL, NULL, NULL),
      (N'23',1.00, 1.00, NULL, NULL, NULL),
      (N'24',1.00, 1.00, NULL, NULL, NULL),
      (N'25',1.00, 1.00, NULL, NULL, NULL),
      (N'26',1.00, 1.00, NULL, NULL, NULL),
      (N'27',1.00, 1.00, NULL, NULL, NULL),
      (N'28',1.00, 1.00, NULL, NULL, NULL),
      (N'29',1.00, 1.00, NULL, NULL, NULL),
      (N'30',1.00, 1.00, NULL, NULL, NULL),
      (N'31',1.00, 1.00, NULL, NULL, NULL),
      (N'32',1.00, 1.00, NULL, NULL, NULL),
      (N'OP',1.00, 1.00, NULL, NULL, NULL),
      (N'33',1.00, 1.00, NULL, NULL, NULL),
      (N'34',1.00, 1.00, NULL, NULL, NULL),
      (N'35',1.00, 1.00, NULL, NULL, NULL),
      (N'36',1.00, 1.00, NULL, NULL, NULL),
      (N'37',1.00, 1.00, NULL, NULL, NULL),
      (N'38',1.00, 1.00, NULL, NULL, NULL),
      (N'39',1.00, 1.00, NULL, NULL, NULL),
      (N'40',1.00, 1.00, NULL, NULL, NULL)
    ) v(FloorCode, FactorWithLift, FactorWithoutLift, CreatedBy, UpdatedBy, UpdatedDate)
)

INSERT INTO PTIS.FloorFactorCVMaster
(
    FloorId,
    YearRangeCVId,
    FactorWithLift,
    FactorWithoutLift,
    CreatedBy,
    UpdatedBy,
    UpdatedDate
)
SELECT
    f.Id,
    yr.Id,
    s.FactorWithLift,
    s.FactorWithoutLift,
    s.CreatedBy,
    s.UpdatedBy,
    s.UpdatedDate
FROM Seed s
JOIN PTIS.FloorMaster f
    ON f.FloorCode = s.FloorCode
JOIN PTIS.AssessmentYearRangeMasterCV yr
    ON yr.Id=1

;WITH N AS
(
    SELECT TOP (100)
           ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS RoomNo
    FROM sys.all_objects
)
INSERT INTO PTIS.RoomNoCountMaster (RoomNo)
SELECT n.RoomNo
FROM N n
WHERE NOT EXISTS (
    SELECT 1
    FROM PTIS.RoomNoCountMaster x
    WHERE x.RoomNo = n.RoomNo
);



INSERT INTO PTIS.AgeFactorCVMaster
(ConstructionTypeId, AgeFrom, AgeTo, Factor, YearRangeCVId, IsActive, CreatedBy, CreatedDate)
SELECT 
    ct.Id,
    v.AgeFrom,
    v.AgeTo,
    v.Factor,
    yr.Id,
    1,
    NULL,
    GETDATE()
FROM (VALUES
 ('A',0,5,1.00),('A',6,10,0.95),('A',11,15,0.90),('A',16,20,0.85),('A',21,25,0.80),
 ('A',26,30,0.75),('A',31,40,0.70),('A',41,50,0.65),('A',51,999,0.60),

 ('B',0,5,0.95),('B',6,10,0.90),('B',11,15,0.85),('B',16,20,0.80),('B',21,25,0.75),
 ('B',26,30,0.70),('B',31,40,0.65),('B',41,50,0.60),('B',51,999,0.55),

 ('C',0,5,0.90),('C',6,10,0.85),('C',11,15,0.80),('C',16,20,0.75),('C',21,25,0.70),
 ('C',26,30,0.65),('C',31,40,0.60),('C',41,50,0.55),('C',51,999,0.50)
) v(ConstructionCode, AgeFrom, AgeTo, Factor)

JOIN PTIS.ConstructionTypeMaster ct
    ON ct.ConstructionCode = v.ConstructionCode

JOIN PTIS.AssessmentYearRangeMasterCV yr
    ON yr.Id = 1;




;WITH Seed(ConstructionCode, Factor, Code, CreatedBy, UpdatedBy, UpdatedDate) AS
(
    SELECT * FROM (VALUES
      (N'A',   1.00, NULL, NULL, NULL, NULL),

      (N'B',   0.80, NULL, NULL, NULL, NULL),
      (N'C',   0.70, NULL, NULL, NULL, NULL),
      (N'D',   0.60, NULL, NULL, NULL, NULL),
      (N'E',   0.60, NULL, NULL, NULL, NULL),

      (N'AR',  1.00, NULL, NULL, NULL, NULL),
      (N'BR',  0.80, NULL, NULL, NULL, NULL),
      (N'CR',  0.70, NULL, NULL, NULL, NULL),
      (N'DR',  0.60, NULL, NULL, NULL, NULL),
      (N'ER',  0.60, NULL, NULL, NULL, NULL),

      (N'WA',  1.00, NULL, NULL, NULL, NULL),
      (N'WB',  0.80, NULL, NULL, NULL, NULL),
      (N'WC',  0.70, NULL, NULL, NULL, NULL),
      (N'WD',  0.60, NULL, NULL, NULL, NULL),
      (N'WE',  0.60, NULL, NULL, NULL, NULL),

      (N'A1',  1.50, NULL, NULL, NULL, NULL),
      (N'B1',  1.30, NULL, NULL, NULL, NULL),
      (N'C1',  1.00, NULL, NULL, NULL, NULL),

      (N'WA1', 1.50, NULL, NULL, NULL, NULL),
      (N'WB1', 1.30, NULL, NULL, NULL, NULL),
      (N'WC1', 1.00, NULL, NULL, NULL, NULL)

     
    ) v(ConstructionCode, Factor, Code, CreatedBy, UpdatedBy, UpdatedDate)
)

INSERT INTO PTIS.NatureFactorCVMaster
(
    ConstructionTypeId,
    YearRangeCVId,
    Factor,
    CreatedBy,
    UpdatedBy,
    UpdatedDate
)
SELECT
    cm.Id,
    yr.Id,
    s.Factor,
    s.CreatedBy,
    s.UpdatedBy,
    s.UpdatedDate
FROM Seed s
JOIN PTIS.ConstructionTypeMaster cm
    ON cm.ConstructionCode = s.ConstructionCode
JOIN PTIS.AssessmentYearRangeMasterCV yr
    ON yr.Id=1



INSERT INTO PTIS.UseFactorCVMaster
(
    TypeOfUseId,
    SubTypeOfUseId,
    Factor,
    YearRangeCVId,
    IsActive,
    CreatedBy,
    CreatedDate
)
SELECT
    tu.Id,
    stu.Id,
    1.00 AS Factor,                
    yr.Id,
    1,
    NULL,
    GETDATE()
FROM PTIS.TypeOfUseMaster tu
JOIN PTIS.SubTypeOfUseMaster stu
    ON stu.Id = tu.Id
JOIN PTIS.AssessmentYearRangeMasterCV yr
    ON yr.Id = 1
WHERE NOT EXISTS
(
    SELECT 1
    FROM PTIS.UseFactorCVMaster u
    WHERE u.TypeOfUseId = tu.Id
      AND u.SubTypeOfUseId = stu.Id
);




--   ;WITH Seed(TypeOfUseCode,  [Description]) AS
-- (
--     SELECT * FROM (VALUES
--       (N'OPK',   N'ओपन पार्किंग'),
--       (N'SPK',  N'स्टील पार्किंग'),
--       (N'OPKC',  N'ओपन पार्किंग अनिवासी'),
--       (N'SPKC',  N'स्टील पार्किंग अनिवासी'),
--       (N'OPKI',  N'ओपन पार्किंग औदयोगिक'),
--       (N'SPKI',  N'स्टील पार्किंग औदयोगिक')
--     ) v(TypeOfUseCode,  [Description])
-- )
-- INSERT INTO PTIS.ParkingTypeMaster (TypeOfUseId, [Description])
-- SELECT tou.Id,  s.[Description]
-- FROM Seed s
-- JOIN PTIS.TypeOfUseMaster tou
--   ON tou.TypeOfUseCode = s.TypeOfUseCode
-- WHERE NOT EXISTS (
--     SELECT 1
--     FROM PTIS.ParkingTypeMaster x
--     WHERE x.TypeOfUseId = tou.Id
     
--       AND x.[Description] = s.[Description]
-- );







SET IDENTITY_INSERT [PTIS].[SubFloorMaster] ON;
GO

INSERT INTO [PTIS].[SubFloorMaster]
(
 [Id],
 [SubFloorCode],
 [Description],
 [DescriptionEnglish],
 [SubFloorPercentage],
 [IsProtected]
)
VALUES
(1, N'Loft', N'LOFT', N'LOFT', 50.00, 1),
(2, N'Attic',N'ATTIC', N'ATTIC', 50.00, 1),
(3, N'Mezzanine', N'MEZZANINE', N'MEZZANINE', 70.00, 1);
GO

SET IDENTITY_INSERT [PTIS].[SubFloorMaster] OFF;
GO






INSERT [PTIS].[TaxZoneMaster] ([TaxZoneNo], [TaxZoneType], [Remark], [CreatedBy], [UpdatedBy], [UpdatedDate]) VALUES
  (N'1', N'1', N'A', NULL, NULL, NULL),
  (N'2', N'2', N'B', NULL, NULL, NULL),
  (N'3', N'3', N'C', NULL, NULL, NULL),
  (N'Z', N'DEFAULT', N'DEFAULT', NULL, NULL, NULL),
  (N'1U', N'1U', N'AU', NULL, NULL, NULL),
  (N'2U', N'2U', N'BU', NULL, NULL, NULL),
  (N'3U', N'3U', N'CU', NULL, NULL, NULL);



;WITH S(RateSectionNo, [Description]) AS
(
  SELECT * FROM (VALUES
   (N'1',N'UTHALSAR'),(N'2',N'NAUPADA'),(N'3',N'KOPRI'),(N'4',N'KALWA'),
   (N'5',N'VITAVA'),(N'6',N'KHAREGAON'),(N'7',N'MUMBRA'),(N'8',N'KAUSA'),
   (N'9',N'SHIL'),(N'10',N'DIVA'),(N'11',N'WAGLE'),(N'12',N'VARTAK'),
   (N'13',N'MAJIWADA'),(N'14',N'BALKUM'),(N'15',N'MANPADA'),(N'16',N'KOLSHET'),
   (N'17',N'OWALA')
  ) v(RateSectionNo,[Description])
)
INSERT INTO PTIS.RateSectionMaster (RateSectionNo, [Description])
SELECT s.RateSectionNo, s.[Description]
FROM S s
WHERE NOT EXISTS (
  SELECT 1 FROM PTIS.RateSectionMaster x
  WHERE x.Id = s.RateSectionNo
);





;WITH Seed AS
(
    SELECT
       
        v.TaxZoneNo,
        v.ConstructionCode,
        v.UseGroupCode,
        v.RateSquareMeter,
        v.RateSquareFeet,
        v.RateRemark,
        v.Col8,
        v.Col9,
        v.Col10,
        v.RateType,       
        v.MinYear,
        v.MaxYear,
        v.RateSectionCode,
        v.OldId            
    FROM (VALUES
     ( N'1', N'A', N'R', 167.9200, 1807.4909, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'12', 2824357),
( N'1', N'B', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'1', 2824358),
( N'1', N'A', N'C', 1020.4300, 10983.9085, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'12', 2824359),
( N'1', N'A', N'C', 904.1800, 9732.5935, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'1', 2824360),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'16', 2824361),
( N'1', N'A', N'C', 335.8400, 3614.9818, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'16', 2824362),
( N'1', N'A', N'C', 516.6700, 5561.4359, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'1', 2824363),
( N'1', N'B', N'R', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'2', 2824364),
( N'1', N'B', N'C', 904.1800, 9732.5935, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'1', 2824365),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'16', 2824366),
( N'1', N'A', N'C', 1130.2200, 12165.6881, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'1', 2824367),
( N'1', N'C', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'2', 2824368),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'4', 2824369),
( N'1', N'A', N'C', 807.3000, 8689.7772, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'4', 2824370),
( N'1', N'B', N'C', 807.3000, 8689.7772, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'4', 2824371),
( N'1', N'C', N'C', 484.3800, 5213.8663, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'4', 2824372),
( N'1', N'D', N'C', 406.8800, 4379.6563, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'4', 2824373),
( N'1', N'E', N'C', 406.8800, 4379.6563, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'4', 2824374),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'4', 2824375),
( N'1', N'A', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'5', 2824376),
( N'1', N'B', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'5', 2824377),
( N'1', N'C', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'5', 2824378),
( N'1', N'D', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'5', 2824379),
( N'1', N'E', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'5', 2824380),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'5', 2824381),
( N'1', N'A', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'5', 2824382),
( N'1', N'B', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'5', 2824383),
( N'1', N'C', N'C', 161.4600, 1737.9554, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'5', 2824384),
( N'1', N'D', N'C', 161.4600, 1737.9554, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'5', 2824385),
( N'1', N'E', N'C', 161.4600, 1737.9554, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'5', 2824386),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'5', 2824387),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'5', 2824388),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'5', 2824389),
( N'1', N'C', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'5', 2824390),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'5', 2824391),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'5', 2824392),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'5', 2824393),
( N'1', N'A', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'5', 2824394),
( N'1', N'B', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'5', 2824395),
( N'1', N'C', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'5', 2824396),
( N'1', N'D', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'5', 2824397),
( N'1', N'E', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'5', 2824398),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'5', 2824399),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'5', 2824400),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'5', 2824401),
( N'1', N'C', N'R', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'5', 2824402),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'5', 2824403),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'5', 2824404),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'5', 2824405),
( N'1', N'A', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'5', 2824406),
( N'1', N'B', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'5', 2824407),
( N'1', N'C', N'C', 271.2500, 2919.7350, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'5', 2824408),
( N'1', N'D', N'R', 167.9200, 1807.4909, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'1', 2824409),
( N'1', N'B', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'1', 2824410),
( N'1', N'A', N'C', 419.8000, 4518.7272, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'1', 2824411),
( N'1', N'A', N'C', 516.6700, 5561.4359, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'1', 2824412),
( N'1', N'A', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'1', 2824413),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'1', 2824414),
( N'1', N'A', N'R', 232.5000, 2502.6300, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'1', 2824415),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'1', 2824416),
( N'1', N'A', N'R', 342.3000, 3684.5172, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'1', 2824417),
( N'1', N'B', N'C', 516.6700, 5561.4359, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'2', 2824418),
( N'1', N'C', N'C', 419.8000, 4518.7272, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'2', 2824419),
( N'1', N'B', N'C', 594.1700, 6395.6459, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'2', 2824420),
( N'1', N'C', N'C', 419.8000, 4518.7272, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'2', 2824421),
( N'1', N'D', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'1', 2824422),
( N'1', N'D', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'2', 2824423),
( N'1', N'E', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'1', 2824424),
( N'1', N'C', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'1', 2824425),
( N'1', N'D', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'2', 2824426),
( N'1', N'D', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'1', 2824427),
( N'1', N'E', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'2', 2824428),
( N'1', N'B', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'2', 2824429),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'1', 2824430),
( N'1', N'C', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'2', 2824431),
( N'1', N'B', N'C', 419.8000, 4518.7272, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'1', 2824432),
( N'1', N'E', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'1', 2824433),
( N'1', N'E', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'13', 2824971),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'13', 2824972),
( N'1', N'A', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'13', 2824973),
( N'1', N'B', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'13', 2824974),
( N'1', N'C', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'13', 2824975),
( N'1', N'D', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'13', 2824976),
( N'1', N'E', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'13', 2824977),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'13', 2824978),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'13', 2824979),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'13', 2824980),
( N'1', N'C', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'13', 2824981),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'13', 2824982),
( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'13', 2824983),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'13', 2824984),
( N'1', N'A', N'C', 387.5000, 4171.0500, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'13', 2824985),
( N'1', N'B', N'C', 387.5000, 4171.0500, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'13', 2824986),
( N'1', N'C', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'13', 2824987),
( N'1', N'D', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'13', 2824988),
( N'1', N'E', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'13', 2824989),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'13', 2824990),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'13', 2824991),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'13', 2824992),
( N'1', N'C', N'R', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'13', 2824993),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'13', 2824994),
( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'13', 2824995),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'13', 2824996),
( N'1', N'A', N'C', 387.5000, 4171.0500, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'13', 2824997),
( N'1', N'B', N'C', 387.5000, 4171.0500, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'13', 2824998),
( N'1', N'C', N'C', 335.8400, 3614.9818, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'13', 2824999),
( N'1', N'D', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'13', 2825000),
( N'1', N'E', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'13', 2825001),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'13', 2825002),
( N'1', N'A', N'R', 135.6300, 1459.9213, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'13', 2825003),
( N'1', N'B', N'R', 135.6300, 1459.9213, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'13', 2825004),
( N'1', N'C', N'R', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'13', 2825005),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'13', 2825006),
( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'13', 2825007),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'13', 2825008),
( N'1', N'A', N'C', 445.6300, 4796.7613, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'13', 2825009),
( N'1', N'B', N'C', 445.6300, 4796.7613, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'13', 2825010),
( N'1', N'C', N'C', 335.8400, 3614.9818, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'13', 2825011),
( N'1', N'D', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'13', 2825012),
( N'1', N'E', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'13', 2825013),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'13', 2825014),
( N'1', N'A', N'R', 167.9200, 1807.4909, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'13', 2825015),
( N'1', N'B', N'R', 167.9200, 1807.4909, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'13', 2825016),
( N'1', N'C', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'13', 2825017),
( N'1', N'D', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'13', 2825018),
( N'1', N'E', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'13', 2825019),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'13', 2825020),
( N'1', N'A', N'C', 645.8400, 6951.8218, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'13', 2825021),
( N'1', N'B', N'C', 645.8400, 6951.8218, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'13', 2825022),
( N'1', N'C', N'C', 516.6700, 5561.4359, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'13', 2825023),
( N'1', N'D', N'C', 452.0900, 4866.2968, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'13', 2825024),
( N'1', N'E', N'C', 452.0900, 4866.2968, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'13', 2825025),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'13', 2825026),
( N'1', N'A', N'R', 368.1300, 3962.5513, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'13', 2825027),
( N'1', N'B', N'R', 368.1300, 3962.5513, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'13', 2825028),
( N'1', N'C', N'R', 219.5900, 2363.6668, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'13', 2825029),
( N'1', N'D', N'R', 187.2900, 2015.9896, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'13', 2825030),
( N'1', N'E', N'R', 187.2900, 2015.9896, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'13', 2825031),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'13', 2825032),
( N'1', N'A', N'C', 1207.7200, 12999.8981, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'13', 2825033),
( N'1', N'B', N'C', 1207.7200, 12999.8981, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'13', 2825034),
( N'1', N'C', N'C', 723.3400, 7786.0318, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'13', 2825035),
( N'1', N'D', N'C', 607.0900, 6534.7168, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'13', 2825036),
( N'1', N'E', N'C', 607.0900, 6534.7168, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'13', 2825037),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'13', 2825038),
( N'1', N'A', N'R', 71.0400, 764.6746, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'14', 2825039),
( N'1', N'B', N'R', 71.0400, 764.6746, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'14', 2825040),
( N'1', N'C', N'R', 58.1300, 625.7113, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'14', 2825041),
( N'1', N'D', N'R', 58.1300, 625.7113, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'14', 2825042),
( N'1', N'E', N'R', 58.1300, 625.7113, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'14', 2825043),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'14', 2825044),
( N'1', N'A', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'14', 2825045),
( N'1', N'B', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'14', 2825046),
( N'1', N'A', N'C', 645.8400, 6951.8218, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'4', 2824434),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'1', 2824435),
( N'1', N'A', N'R', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'1', 2824436),
( N'1', N'A', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'2', 2824437),
( N'1', N'B', N'R', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'1', 2824438),
( N'1', N'A', N'C', 516.6700, 5561.4359, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'2', 2824439),
( N'1', N'B', N'C', 516.6700, 5561.4359, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'1', 2824440),
( N'1', N'B', N'C', 516.6700, 5561.4359, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'2', 2824441),
( N'1', N'C', N'C', 723.3400, 7786.0318, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'1', 2824442),
( N'1', N'B', N'C', 374.5900, 4032.0868, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'5', 2824443),
( N'1', N'C', N'C', 271.2500, 2919.7350, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'5', 2824444),
( N'1', N'D', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'5', 2824445),
( N'1', N'E', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'5', 2824446),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'5', 2824447),
( N'1', N'A', N'R', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'5', 2824448),
( N'1', N'B', N'R', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'5', 2824449),
( N'1', N'C', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'5', 2824450),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'5', 2824451),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'5', 2824452),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'5', 2824453),
( N'1', N'B', N'C', 452.0900, 4866.2968, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'5', 2824454),
( N'1', N'C', N'C', 361.6700, 3893.0159, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'5', 2824455),
( N'1', N'D', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'5', 2824456),
( N'1', N'E', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'5', 2824457),
( N'1', N'A', N'C', 452.0900, 4866.2968, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'5', 2824458),
( N'1', N'B', N'R', 213.1300, 2294.1313, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'5', 2824459),
( N'1', N'C', N'R', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'5', 2824460),
( N'1', N'D', N'R', 109.7900, 1181.7796, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'5', 2824461),
( N'1', N'E', N'R', 109.7900, 1181.7796, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'5', 2824462),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'5', 2824463),
( N'1', N'A', N'C', 613.5500, 6604.2522, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'5', 2824464),
( N'1', N'B', N'C', 613.5500, 6604.2522, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'5', 2824465),
( N'1', N'C', N'C', 368.1300, 3962.5513, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'5', 2824466),
( N'1', N'D', N'C', 310.0000, 3336.8400, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'5', 2824467),
( N'1', N'E', N'C', 310.0000, 3336.8400, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'5', 2824468),
( N'1', N'B', N'R', 71.0400, 764.6746, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'6', 2824469),
( N'1', N'C', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'6', 2824470),
( N'1', N'D', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'6', 2824471),
( N'1', N'E', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'6', 2824472),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'6', 2824473),
( N'1', N'A', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'6', 2824474),
( N'1', N'B', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'6', 2824475),
( N'1', N'C', N'C', 161.4600, 1737.9554, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'6', 2824476),
( N'1', N'D', N'C', 161.4600, 1737.9554, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'6', 2824477),
( N'1', N'E', N'C', 161.4600, 1737.9554, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'6', 2824478),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'6', 2824479),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'6', 2824480),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'6', 2824481),
( N'1', N'D', N'C', 452.0900, 4866.2968, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'4', 2824482),
( N'1', N'D', N'C', 632.9200, 6812.7509, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'1', 2824483),
( N'1', N'E', N'C', 452.0900, 4866.2968, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'4', 2824484),
( N'1', N'E', N'C', 632.9200, 6812.7509, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'1', 2824485),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'4', 2824486),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'1', 2824487),
( N'1', N'C', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'1', 2824488),
( N'1', N'B', N'R', 232.5000, 2502.6300, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'1', 2824489),
( N'1', N'A', N'R', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'4', 2824490),
( N'1', N'C', N'C', 678.1300, 7299.3913, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'1', 2824491),
( N'1', N'B', N'R', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'4', 2824492),
( N'1', N'D', N'C', 568.3400, 6117.6118, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'1', 2824493),
( N'1', N'E', N'C', 568.3400, 6117.6118, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'1', 2824494),
( N'1', N'A', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'3', 2824495),
( N'1', N'E', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'2', 2824496),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'1', 2824497),
( N'1', N'E', N'R', 167.9200, 1807.4909, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'1', 2824498),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'2', 2824499),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'1', 2824500),
( N'1', N'A', N'R', 135.6300, 1459.9213, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'8', 2824501),
( N'1', N'C', N'R', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'4', 2824502),
( N'1', N'C', N'R', 206.6700, 2224.5959, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'1', 2824503),
( N'1', N'D', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'4', 2824504),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'6', 2824505),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'6', 2824506),
( N'1', N'A', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'6', 2824507),
( N'1', N'B', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'6', 2824508),
( N'1', N'C', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'6', 2824509),
( N'1', N'D', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'6', 2824510),
( N'1', N'C', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'14', 2825047),
( N'1', N'D', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'14', 2825048),
( N'1', N'E', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'14', 2825049),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'14', 2825050),
( N'1', N'A', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'14', 2825051),
( N'1', N'B', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'14', 2825052),
( N'1', N'C', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'14', 2825053),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'14', 2825054),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'14', 2825055),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'14', 2825056),
( N'1', N'A', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'14', 2825057),
( N'1', N'B', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'14', 2825058),
( N'1', N'C', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'14', 2825059),
( N'1', N'D', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'14', 2825060),
( N'1', N'E', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'14', 2825061),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'14', 2825062),
( N'1', N'A', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'14', 2825063),
( N'1', N'B', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'14', 2825064),
( N'1', N'C', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'14', 2825065),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'14', 2825066),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'14', 2825067),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'14', 2825068),
( N'1', N'A', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'14', 2825069),
( N'1', N'B', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'14', 2825070),
( N'1', N'C', N'C', 238.9600, 2572.1654, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'14', 2825071),
( N'1', N'D', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'14', 2825072),
( N'1', N'E', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'14', 2825073),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'14', 2825074),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'14', 2825075),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'14', 2825076),
( N'1', N'C', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'14', 2825077),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'14', 2825078),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'14', 2825079),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'14', 2825080),
( N'1', N'A', N'C', 335.8400, 3614.9818, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'14', 2825081),
( N'1', N'B', N'C', 335.8400, 3614.9818, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'14', 2825082),
( N'1', N'C', N'C', 238.9600, 2572.1654, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'14', 2825083),
( N'1', N'D', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'14', 2825084),
( N'1', N'E', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'14', 2825085),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'14', 2825086),
( N'1', N'A', N'R', 155.0000, 1668.4200, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'14', 2825087),
( N'1', N'B', N'R', 155.0000, 1668.4200, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'14', 2825088),
( N'1', N'C', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'14', 2825089),
( N'1', N'D', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'14', 2825090),
( N'1', N'E', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'14', 2825091),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'14', 2825092),
( N'1', N'A', N'C', 452.0900, 4866.2968, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'14', 2825093),
( N'1', N'B', N'C', 452.0900, 4866.2968, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'14', 2825094),
( N'1', N'C', N'C', 361.6700, 3893.0159, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'14', 2825095),
( N'1', N'D', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'14', 2825096),
( N'1', N'E', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'14', 2825097),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'14', 2825098),
( N'1', N'A', N'R', 271.2500, 2919.7350, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'14', 2825099),
( N'1', N'B', N'R', 271.2500, 2919.7350, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'14', 2825100),
( N'1', N'C', N'R', 180.8400, 1946.5618, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'14', 2825101),
( N'1', N'D', N'R', 155.0000, 1668.4200, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'14', 2825102),
( N'1', N'E', N'R', 155.0000, 1668.4200, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'14', 2825103),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'14', 2825104),
( N'1', N'A', N'C', 800.8400, 8620.2418, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'14', 2825105),
( N'1', N'B', N'C', 800.8400, 8620.2418, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'14', 2825106),
( N'1', N'C', N'C', 477.9200, 5144.3309, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'14', 2825107),
( N'1', N'D', N'C', 400.4200, 4310.1209, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'14', 2825108),
( N'1', N'E', N'C', 400.4200, 4310.1209, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'14', 2825109),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'14', 2825110),
( N'1', N'B', N'R', 71.0400, 764.6746, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'15', 2825111),
( N'1', N'C', N'R', 58.1300, 625.7113, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'15', 2825112),
( N'1', N'D', N'R', 58.1300, 625.7113, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'15', 2825113),
( N'1', N'E', N'R', 58.1300, 625.7113, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'15', 2825114),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'15', 2825115),
( N'1', N'A', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'15', 2825116),
( N'1', N'B', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'15', 2825117),
( N'1', N'C', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'15', 2825118),
( N'1', N'D', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'15', 2825119),
( N'1', N'E', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'15', 2825120),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'15', 2825121),
( N'1', N'A', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'15', 2825122),
( N'1', N'E', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'6', 2824511),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'6', 2824512),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'6', 2824513),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'6', 2824514),
( N'1', N'C', N'R', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'6', 2824515),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'6', 2824516),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'6', 2824517),
( N'1', N'B', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'6', 2824518),
( N'1', N'C', N'C', 271.2500, 2919.7350, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'6', 2824519),
( N'1', N'D', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'6', 2824520),
( N'1', N'E', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'6', 2824521),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'6', 2824522),
( N'1', N'A', N'R', 135.6300, 1459.9213, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'6', 2824523),
( N'1', N'B', N'R', 135.6300, 1459.9213, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'6', 2824524),
( N'1', N'C', N'R', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'6', 2824525),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'6', 2824526),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'6', 2824527),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'6', 2824528),
( N'1', N'A', N'C', 374.5900, 4032.0868, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'6', 2824529),
( N'1', N'B', N'C', 374.5900, 4032.0868, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'6', 2824530),
( N'1', N'D', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'2', 2824531),
( N'1', N'E', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'2', 2824532),
( N'1', N'A', N'C', 594.1700, 6395.6459, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'2', 2824533),
( N'1', N'A', N'R', 232.5000, 2502.6300, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'2', 2824534),
( N'1', N'B', N'R', 232.5000, 2502.6300, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'2', 2824535),
( N'1', N'C', N'R', 167.9200, 1807.4909, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'2', 2824536),
( N'1', N'D', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'2', 2824537),
( N'1', N'E', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'2', 2824538),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'2', 2824539),
( N'1', N'A', N'C', 904.1800, 9732.5935, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'2', 2824540),
( N'1', N'B', N'C', 904.1800, 9732.5935, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'2', 2824541),
( N'1', N'C', N'C', 723.3400, 7786.0318, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'2', 2824542),
( N'1', N'D', N'C', 632.9200, 6812.7509, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'2', 2824543),
( N'1', N'A', N'C', 1420.8500, 15294.0294, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'2', 2824544),
( N'1', N'B', N'C', 1420.8500, 15294.0294, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'2', 2824545),
( N'1', N'C', N'C', 852.5100, 9176.4176, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'2', 2824546),
( N'1', N'D', N'C', 710.4200, 7646.9609, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'2', 2824547),
( N'1', N'E', N'C', 710.4200, 7646.9609, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'2', 2824548),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'2', 2824549),
( N'1', N'A', N'R', 413.3400, 4449.1918, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'2', 2824550),
( N'1', N'B', N'R', 413.3400, 4449.1918, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'2', 2824551),
( N'1', N'C', N'R', 245.4200, 2641.7009, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'2', 2824552),
( N'1', N'D', N'R', 206.6700, 2224.5959, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'2', 2824553),
( N'1', N'E', N'R', 206.6700, 2224.5959, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'2', 2824554),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'2', 2824555),
( N'1', N'A', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'3', 2824556),
( N'1', N'E', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'6', 2824557),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'6', 2824558),
( N'1', N'A', N'R', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'6', 2824559),
( N'1', N'B', N'R', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'6', 2824560),
( N'1', N'C', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'6', 2824561),
( N'1', N'D', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'6', 2824562),
( N'1', N'E', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'6', 2824563),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'6', 2824564),
( N'1', N'A', N'C', 452.0900, 4866.2968, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'6', 2824565),
( N'1', N'B', N'C', 452.0900, 4866.2968, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'6', 2824566),
( N'1', N'C', N'C', 361.6700, 3893.0159, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'6', 2824567),
( N'1', N'D', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'6', 2824568),
( N'1', N'E', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'6', 2824569),
( N'1', N'B', N'R', 206.6700, 2224.5959, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'6', 2824570),
( N'1', N'C', N'R', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'6', 2824571),
( N'1', N'D', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'6', 2824572),
( N'1', N'E', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'6', 2824573),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'6', 2824574),
( N'1', N'A', N'C', 568.3400, 6117.6118, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'6', 2824575),
( N'1', N'B', N'C', 568.3400, 6117.6118, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'6', 2824576),
( N'1', N'C', N'C', 342.3000, 3684.5172, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'6', 2824577),
( N'1', N'D', N'C', 284.1700, 3058.8059, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'6', 2824578),
( N'1', N'E', N'C', 284.1700, 3058.8059, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'6', 2824579),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'6', 2824580),
( N'1', N'A', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'7', 2824581),
( N'1', N'B', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'7', 2824582),
( N'1', N'C', N'R', 45.2100, 486.6404, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'7', 2824583),
( N'1', N'D', N'R', 45.2100, 486.6404, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'7', 2824584),
( N'1', N'E', N'R', 45.2100, 486.6404, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'7', 2824585),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'7', 2824586),
( N'1', N'A', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'7', 2824587),
( N'1', N'B', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'15', 2825123),
( N'1', N'C', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'15', 2825124),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'15', 2825125),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'15', 2825126),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'15', 2825127),
( N'1', N'B', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'15', 2825128),
( N'1', N'C', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'15', 2825129),
( N'1', N'D', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'15', 2825130),
( N'1', N'E', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'15', 2825131),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'15', 2825132),
( N'1', N'A', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'15', 2825133),
( N'1', N'B', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'15', 2825134),
( N'1', N'C', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'15', 2825135),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'15', 2825136),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'15', 2825137),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'15', 2825138),
( N'1', N'A', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'15', 2825139),
( N'1', N'B', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'15', 2825140),
( N'1', N'C', N'C', 238.9600, 2572.1654, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'15', 2825141),
( N'1', N'D', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'15', 2825142),
( N'1', N'E', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'15', 2825143),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'15', 2825144),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'15', 2825145),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'15', 2825146),
( N'1', N'C', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'15', 2825147),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'15', 2825148),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'15', 2825149),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'15', 2825150),
( N'1', N'A', N'C', 335.8400, 3614.9818, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'15', 2825151),
( N'1', N'B', N'C', 335.8400, 3614.9818, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'15', 2825152),
( N'1', N'C', N'C', 238.9600, 2572.1654, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'15', 2825153),
( N'1', N'D', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'15', 2825154),
( N'1', N'E', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'15', 2825155),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'15', 2825156),
( N'1', N'A', N'R', 155.0000, 1668.4200, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'15', 2825157),
( N'1', N'B', N'R', 155.0000, 1668.4200, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'15', 2825158),
( N'1', N'C', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'15', 2825159),
( N'1', N'D', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'15', 2825160),
( N'1', N'E', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'15', 2825161),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'15', 2825162),
( N'1', N'A', N'C', 452.0900, 4866.2968, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'15', 2825163),
( N'1', N'B', N'C', 452.0900, 4866.2968, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'15', 2825164),
( N'1', N'C', N'C', 361.6700, 3893.0159, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'15', 2825165),
( N'1', N'D', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'15', 2825166),
( N'1', N'E', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'15', 2825167),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'15', 2825168),
( N'1', N'B', N'R', 387.5000, 4171.0500, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'15', 2825169),
( N'1', N'C', N'R', 232.5000, 2502.6300, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'15', 2825170),
( N'1', N'D', N'R', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'15', 2825171),
( N'1', N'E', N'R', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'15', 2825172),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'15', 2825173),
( N'1', N'A', N'R', 387.5000, 4171.0500, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'15', 2825174),
( N'1', N'B', N'C', 1110.8400, 11957.0818, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'15', 2825175),
( N'1', N'C', N'C', 671.6700, 7229.8559, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'15', 2825176),
( N'1', N'D', N'C', 555.4200, 5978.5409, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'15', 2825177),
( N'1', N'E', N'C', 555.4200, 5978.5409, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'15', 2825178),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'15', 2825179),
( N'1', N'A', N'C', 1110.8400, 11957.0818, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'15', 2825180),
( N'1', N'A', N'R', 71.0400, 764.6746, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'16', 2825181),
( N'1', N'B', N'R', 71.0400, 764.6746, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'16', 2825182),
( N'1', N'C', N'R', 58.1300, 625.7113, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'16', 2825183),
( N'1', N'D', N'R', 58.1300, 625.7113, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'16', 2825184),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'16', 2825185),
( N'1', N'E', N'R', 58.1300, 625.7113, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'16', 2825186),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'16', 2825187),
( N'1', N'A', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'16', 2825188),
( N'1', N'A', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'16', 2825189),
( N'1', N'B', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'16', 2825190),
( N'1', N'D', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'16', 2825191),
( N'1', N'C', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'16', 2825192),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'12', 2825193),
( N'1', N'D', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'16', 2825194),
( N'1', N'E', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'16', 2825195),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'12', 2825196),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'16', 2825197),
( N'1', N'B', N'R', 155.0000, 1668.4200, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'16', 2825198),
( N'1', N'B', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'7', 2824588),
( N'1', N'C', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'7', 2824589),
( N'1', N'D', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'7', 2824590),
( N'1', N'E', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'7', 2824591),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'7', 2824592),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'7', 2824593),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'7', 2824594),
( N'1', N'C', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'7', 2824595),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'7', 2824596),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'7', 2824597),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'7', 2824598),
( N'1', N'A', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'7', 2824599),
( N'1', N'B', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'7', 2824600),
( N'1', N'C', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'7', 2824601),
( N'1', N'D', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'7', 2824602),
( N'1', N'E', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'7', 2824603),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'7', 2824604),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'7', 2824605),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'7', 2824606),
( N'1', N'C', N'R', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'7', 2824607),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'7', 2824608),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'7', 2824609),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'7', 2824610),
( N'1', N'A', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'7', 2824611),
( N'1', N'B', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'7', 2824612),
( N'1', N'C', N'C', 271.2500, 2919.7350, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'7', 2824613),
( N'1', N'D', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'7', 2824614),
( N'1', N'E', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'7', 2824615),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'7', 2824616),
( N'1', N'A', N'R', 135.6300, 1459.9213, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'7', 2824617),
( N'1', N'B', N'R', 135.6300, 1459.9213, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'7', 2824618),
( N'1', N'C', N'R', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'7', 2824619),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'7', 2824620),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'7', 2824621),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'7', 2824622),
( N'1', N'A', N'C', 374.5900, 4032.0868, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'7', 2824623),
( N'1', N'B', N'C', 374.5900, 4032.0868, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'7', 2824624),
( N'1', N'C', N'C', 271.2500, 2919.7350, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'7', 2824625),
( N'1', N'D', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'7', 2824626),
( N'1', N'E', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'7', 2824627),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'7', 2824628),
( N'1', N'A', N'R', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'7', 2824629),
( N'1', N'B', N'R', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'7', 2824630),
( N'1', N'C', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'7', 2824631),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'7', 2824632),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'7', 2824633),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'7', 2824634),
( N'1', N'A', N'C', 452.0900, 4866.2968, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'7', 2824635),
( N'1', N'B', N'C', 452.0900, 4866.2968, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'7', 2824636),
( N'1', N'C', N'C', 361.6700, 3893.0159, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'7', 2824637),
( N'1', N'D', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'7', 2824638),
( N'1', N'E', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'7', 2824639),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'7', 2824640),
( N'1', N'A', N'R', 187.2900, 2015.9896, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'7', 2824641),
( N'1', N'B', N'R', 187.2900, 2015.9896, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'7', 2824642),
( N'1', N'C', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'7', 2824643),
( N'1', N'D', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'7', 2824644),
( N'1', N'E', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'7', 2824645),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'7', 2824646),
( N'1', N'A', N'C', 568.3400, 6117.6118, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'7', 2824647),
( N'1', N'B', N'C', 568.3400, 6117.6118, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'7', 2824648),
( N'1', N'C', N'C', 342.3000, 3684.5172, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'7', 2824649),
( N'1', N'D', N'C', 284.1700, 3058.8059, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'7', 2824650),
( N'1', N'E', N'C', 284.1700, 3058.8059, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'7', 2824651),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'7', 2824652),
( N'1', N'A', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'8', 2824653),
( N'1', N'B', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'8', 2824654),
( N'1', N'C', N'R', 45.2100, 486.6404, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'8', 2824655),
( N'1', N'D', N'R', 45.2100, 486.6404, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'8', 2824656),
( N'1', N'E', N'R', 45.2100, 486.6404, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'8', 2824657),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'8', 2824658),
( N'1', N'A', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'8', 2824659),
( N'1', N'B', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'8', 2824660),
( N'1', N'C', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'8', 2824661),
( N'1', N'D', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'8', 2824662),
( N'1', N'E', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'8', 2824663),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'8', 2824664),
( N'1', N'C', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'16', 2825199),
( N'1', N'A', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'12', 2825200),
( N'1', N'D', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'12', 2825201),
( N'1', N'D', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'16', 2825202),
( N'1', N'E', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'16', 2825203),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'16', 2825204),
( N'1', N'A', N'R', 155.0000, 1668.4200, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'16', 2825205),
( N'1', N'A', N'C', 516.6700, 5561.4359, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'16', 2825206),
( N'1', N'B', N'C', 516.6700, 5561.4359, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'16', 2825207),
( N'1', N'C', N'C', 413.3400, 4449.1918, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'16', 2825208),
( N'1', N'D', N'C', 361.6700, 3893.0159, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'16', 2825209),
( N'1', N'E', N'C', 361.6700, 3893.0159, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'16', 2825210),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'16', 2825211),
( N'1', N'A', N'R', 284.1700, 3058.8059, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'16', 2825212),
( N'1', N'B', N'R', 284.1700, 3058.8059, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'16', 2825213),
( N'1', N'C', N'R', 167.9200, 1807.4909, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'16', 2825214),
( N'1', N'D', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'16', 2825215),
( N'1', N'E', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'16', 2825216),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'16', 2825217),
( N'1', N'A', N'C', 794.3800, 8550.7063, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'16', 2825218),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'16', 2825219),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'16', 2825220),
( N'1', N'B', N'C', 794.3800, 8550.7063, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'16', 2825221),
( N'1', N'C', N'C', 477.9200, 5144.3309, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'16', 2825222),
( N'1', N'B', N'C', 335.8400, 3614.9818, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'16', 2825223),
( N'1', N'D', N'C', 400.4200, 4310.1209, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'16', 2825224),
( N'1', N'E', N'C', 400.4200, 4310.1209, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'16', 2825225),
( N'1', N'A', N'R', 135.6300, 1459.9213, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'12', 2825226),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'16', 2825227),
( N'1', N'A', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'17', 2825228),
( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'12', 2825229),
( N'1', N'B', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'17', 2825230),
( N'1', N'C', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'17', 2825231),
( N'1', N'C', N'C', 271.2500, 2919.7350, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'12', 2825232),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'2', 2825233),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'12', 2825234),
( N'1', N'A', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'2', 2825235),
( N'1', N'B', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'2', 2825236),
( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'12', 2825237),
( N'1', N'C', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'2', 2825238),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'2', 2825239),
( N'1', N'C', N'C', 271.2500, 2919.7350, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'12', 2825240),
( N'1', N'A', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'16', 2825241),
( N'1', N'A', N'R', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'2', 2825242),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'16', 2825243),
( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'2', 2825244),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'2', 2825245),
( N'1', N'A', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'16', 2825246),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'2', 2825247),
( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'2', 2825248),
( N'1', N'D', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'16', 2825249),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'2', 2825250),
( N'1', N'A', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'16', 2825251),
( N'1', N'A', N'C', 516.6700, 5561.4359, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'2', 2825252),
( N'1', N'C', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'1', 2825253),
( N'1', N'D', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'2', 2825254),
( N'1', N'E', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'2', 2825255),
( N'1', N'E', N'C', 632.9200, 6812.7509, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'2', 2825256),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'2', 2825257),
( N'1', N'D', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'5', 2825258),
( N'1', N'E', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'5', 2825259),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'5', 2825260),
( N'1', N'A', N'R', 135.6300, 1459.9213, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'5', 2825261),
( N'1', N'B', N'R', 135.6300, 1459.9213, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'5', 2825262),
( N'1', N'B', N'R', 342.3000, 3684.5172, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'1', 2825263),
( N'1', N'A', N'R', 71.0400, 764.6746, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'15', 2825264),
( N'1', N'A', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'15', 2825265),
( N'1', N'C', N'R', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'5', 2825266),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'5', 2825267),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'5', 2825268),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'5', 2825269),
( N'1', N'A', N'C', 374.5900, 4032.0868, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'5', 2825270),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'5', 2825271),
( N'1', N'A', N'R', 213.1300, 2294.1313, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'5', 2825272),
( N'1', N'A', N'C', 594.1700, 6395.6459, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'3', 2825273),
( N'1', N'A', N'C', 387.5000, 4171.0500, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'4', 2825274),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'8', 2824665),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'8', 2824666),
( N'1', N'C', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'8', 2824667),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'8', 2824668),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'8', 2824669),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'8', 2824670),
( N'1', N'B', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'8', 2824671),
( N'1', N'C', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'8', 2824672),
( N'1', N'D', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'8', 2824673),
( N'1', N'E', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'8', 2824674),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'8', 2824675),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'8', 2824676),
( N'1', N'A', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'8', 2824677),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'8', 2824678),
( N'1', N'C', N'R', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'8', 2824679),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'8', 2824680),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'8', 2824681),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'8', 2824682),
( N'1', N'A', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'8', 2824683),
( N'1', N'B', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'8', 2824684),
( N'1', N'C', N'C', 271.2500, 2919.7350, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'8', 2824685),
( N'1', N'D', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'8', 2824686),
( N'1', N'E', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'8', 2824687),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'8', 2824688),
( N'1', N'B', N'R', 135.6300, 1459.9213, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'8', 2824689),
( N'1', N'C', N'R', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'8', 2824690),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'8', 2824691),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'8', 2824692),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'8', 2824693),
( N'1', N'A', N'C', 374.5900, 4032.0868, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'8', 2824694),
( N'1', N'B', N'C', 374.5900, 4032.0868, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'8', 2824695),
( N'1', N'C', N'C', 271.2500, 2919.7350, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'8', 2824696),
( N'1', N'D', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'8', 2824697),
( N'1', N'E', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'8', 2824698),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'8', 2824699),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'8', 2824700),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'8', 2824701),
( N'1', N'C', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'8', 2824702),
( N'1', N'D', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'8', 2824703),
( N'1', N'E', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'8', 2824704),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'8', 2824705),
( N'1', N'A', N'C', 452.0900, 4866.2968, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'8', 2824706),
( N'1', N'B', N'C', 452.0900, 4866.2968, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'8', 2824707),
( N'1', N'C', N'C', 361.6700, 3893.0159, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'8', 2824708),
( N'1', N'D', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'8', 2824709),
( N'1', N'E', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'8', 2824710),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'8', 2824711),
( N'1', N'A', N'R', 155.0000, 1668.4200, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'8', 2824712),
( N'1', N'B', N'R', 155.0000, 1668.4200, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'8', 2824713),
( N'1', N'C', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'8', 2824714),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'8', 2824715),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'8', 2824716),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'8', 2824717),
( N'1', N'B', N'C', 568.3400, 6117.6118, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'8', 2824718),
( N'1', N'C', N'C', 342.3000, 3684.5172, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'8', 2824719),
( N'1', N'D', N'C', 284.1700, 3058.8059, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'8', 2824720),
( N'1', N'E', N'C', 284.1700, 3058.8059, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'8', 2824721),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'8', 2824722),
( N'1', N'A', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'9', 2824723),
( N'1', N'A', N'C', 568.3400, 6117.6118, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'8', 2824724),
( N'1', N'B', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'9', 2824725),
( N'1', N'C', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'9', 2824726),
( N'1', N'D', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'9', 2824727),
( N'1', N'E', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'9', 2824728),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'9', 2824729),
( N'1', N'A', N'C', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'9', 2824730),
( N'1', N'B', N'C', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'9', 2824731),
( N'1', N'C', N'C', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'9', 2824732),
( N'1', N'D', N'C', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'9', 2824733),
( N'1', N'E', N'C', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'9', 2824734),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'9', 2824735),
( N'1', N'A', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'9', 2824736),
( N'1', N'B', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'9', 2824737),
( N'1', N'C', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'9', 2824738),
( N'1', N'D', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'9', 2824739),
( N'1', N'E', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'9', 2824740),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'9', 2824741),
( N'1', N'B', N'C', 1130.2200, 12165.6881, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'1', 2825275),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'1', 2825276),
( N'1', N'B', N'C', 516.6700, 5561.4359, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'1', 2825277),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'5', 2825278),
( N'1', N'A', N'R', 71.0400, 764.6746, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'6', 2825279),
( N'1', N'C', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'6', 2825280),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'6', 2825281),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'6', 2825282),
( N'1', N'A', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'6', 2825283),
( N'1', N'C', N'C', 271.2500, 2919.7350, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'6', 2825284),
( N'1', N'D', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'6', 2825285),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'2', 2825286),
( N'1', N'A', N'R', 161.4600, 1737.9554, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'2', 2825287),
( N'1', N'B', N'R', 161.4600, 1737.9554, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'2', 2825288),
( N'1', N'C', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'2', 2825289),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'2', 2825290),
( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'2', 2825291),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'2', 2825292),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'2', 2825293),
( N'1', N'B', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'4', 2825294),
( N'1', N'C', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'4', 2825295),
( N'1', N'A', N'C', 419.8000, 4518.7272, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'2', 2825296),
( N'1', N'C', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'1', 2825297),
( N'1', N'B', N'C', 419.8000, 4518.7272, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'2', 2825298),
( N'1', N'D', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'2', 2825299),
( N'1', N'E', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'2', 2825300),
( N'1', N'B', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'3', 2825301),
( N'1', N'C', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'3', 2825302),
( N'1', N'D', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'3', 2825303),
( N'1', N'E', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'3', 2825304),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'3', 2825305),
( N'1', N'A', N'C', 355.2100, 3823.4804, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'3', 2825306),
( N'1', N'B', N'C', 355.2100, 3823.4804, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'3', 2825307),
( N'1', N'C', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'3', 2825308),
( N'1', N'D', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'3', 2825309),
( N'1', N'E', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'3', 2825310),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'3', 2825311),
( N'1', N'B', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'3', 2825312),
( N'1', N'C', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'3', 2825313),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'3', 2825314),
( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'3', 2825315),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'3', 2825316),
( N'1', N'A', N'C', 516.6700, 5561.4359, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'3', 2825317),
( N'1', N'B', N'C', 516.6700, 5561.4359, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'3', 2825318),
( N'1', N'C', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'3', 2825319),
( N'1', N'D', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'3', 2825320),
( N'1', N'E', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'3', 2825321),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'3', 2825322),
( N'1', N'B', N'C', 516.6700, 5561.4359, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'3', 2825323),
( N'1', N'C', N'C', 400.4200, 4310.1209, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'3', 2825324),
( N'1', N'D', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'3', 2825325),
( N'1', N'E', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'3', 2825326),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'3', 2825327),
( N'1', N'A', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'3', 2825328),
( N'1', N'A', N'C', 516.6700, 5561.4359, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'3', 2825329),
( N'1', N'B', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'3', 2825330),
( N'1', N'C', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'3', 2825331),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'3', 2825332),
( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'3', 2825333),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'3', 2825334),
( N'1', N'A', N'R', 161.4600, 1737.9554, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'3', 2825335),
( N'1', N'B', N'R', 161.4600, 1737.9554, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'3', 2825336),
( N'1', N'C', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'3', 2825337),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'3', 2825338),
( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'3', 2825339),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'3', 2825340),
( N'1', N'B', N'C', 594.1700, 6395.6459, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'3', 2825341),
( N'1', N'C', N'C', 400.4200, 4310.1209, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'3', 2825342),
( N'1', N'D', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'3', 2825343),
( N'1', N'E', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'3', 2825344),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'3', 2825345),
( N'1', N'A', N'C', 645.8400, 6951.8218, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'3', 2825346),
( N'1', N'B', N'C', 645.8400, 6951.8218, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'3', 2825347),
( N'1', N'C', N'C', 516.6700, 5561.4359, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'3', 2825348),
( N'1', N'D', N'C', 452.0900, 4866.2968, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'3', 2825349),
( N'1', N'E', N'C', 452.0900, 4866.2968, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'3', 2825350),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'3', 2825351),
( N'1', N'B', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'9', 2824742),
( N'1', N'C', N'R', 71.0400, 764.6746, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'9', 2824743),
( N'1', N'D', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'9', 2824744),
( N'1', N'E', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'9', 2824745),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'9', 2824746),
( N'1', N'A', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'9', 2824747),
( N'1', N'A', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'9', 2824748),
( N'1', N'B', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'9', 2824749),
( N'1', N'C', N'C', 122.7100, 1320.8504, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'9', 2824750),
( N'1', N'D', N'C', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'9', 2824751),
( N'1', N'E', N'C', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'9', 2824752),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'9', 2824753),
( N'1', N'A', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'9', 2824754),
( N'1', N'B', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'9', 2824755),
( N'1', N'C', N'R', 71.0400, 764.6746, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'9', 2824756),
( N'1', N'D', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'9', 2824757),
( N'1', N'E', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'9', 2824758),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'9', 2824759),
( N'1', N'A', N'C', 148.5400, 1598.8846, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'9', 2824760),
( N'1', N'B', N'C', 148.5400, 1598.8846, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'9', 2824761),
( N'1', N'C', N'C', 122.7100, 1320.8504, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'9', 2824762),
( N'1', N'D', N'C', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'9', 2824763),
( N'1', N'E', N'C', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'9', 2824764),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'9', 2824765),
( N'1', N'A', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'9', 2824766),
( N'1', N'B', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'9', 2824767),
( N'1', N'C', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'9', 2824768),
( N'1', N'D', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'9', 2824769),
( N'1', N'E', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'9', 2824770),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'9', 2824771),
( N'1', N'A', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'9', 2824772),
( N'1', N'B', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'9', 2824773),
( N'1', N'C', N'C', 206.6700, 2224.5959, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'9', 2824774),
( N'1', N'D', N'C', 180.8400, 1946.5618, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'9', 2824775),
( N'1', N'E', N'C', 180.8400, 1946.5618, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'9', 2824776),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'9', 2824777),
( N'1', N'A', N'R', 155.0000, 1668.4200, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'9', 2824778),
( N'1', N'B', N'R', 155.0000, 1668.4200, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'9', 2824779),
( N'1', N'C', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'9', 2824780),
( N'1', N'D', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'9', 2824781),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'9', 2824782),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'9', 2824783),
( N'1', N'B', N'C', 361.6700, 3893.0159, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'9', 2824784),
( N'1', N'C', N'C', 219.5900, 2363.6668, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'9', 2824785),
( N'1', N'D', N'C', 180.8400, 1946.5618, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'9', 2824786),
( N'1', N'E', N'C', 180.8400, 1946.5618, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'9', 2824787),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'9', 2824788),
( N'1', N'A', N'C', 361.6700, 3893.0159, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'9', 2824789),
( N'1', N'A', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'10', 2824790),
( N'1', N'B', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'10', 2824791),
( N'1', N'C', N'R', 38.7500, 417.1050, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'10', 2824792),
( N'1', N'D', N'R', 38.7500, 417.1050, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'10', 2824793),
( N'1', N'E', N'R', 38.7500, 417.1050, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'10', 2824794),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'10', 2824795),
( N'1', N'B', N'C', 109.7900, 1181.7796, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'10', 2824796),
( N'1', N'C', N'C', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'10', 2824797),
( N'1', N'D', N'C', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'10', 2824798),
( N'1', N'E', N'C', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'10', 2824799),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'10', 2824800),
( N'1', N'A', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'10', 2824801),
( N'1', N'A', N'C', 109.7900, 1181.7796, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'10', 2824802),
( N'1', N'B', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'10', 2824803),
( N'1', N'C', N'R', 58.1300, 625.7113, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'10', 2824804),
( N'1', N'D', N'R', 58.1300, 625.7113, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'10', 2824805),
( N'1', N'E', N'R', 58.1300, 625.7113, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'10', 2824806),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'10', 2824807),
( N'1', N'A', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'10', 2824808),
( N'1', N'B', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'10', 2824809),
( N'1', N'C', N'C', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'10', 2824810),
( N'1', N'D', N'C', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'10', 2824811),
( N'1', N'E', N'C', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'10', 2824812),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'10', 2824813),
( N'1', N'B', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'10', 2824814),
( N'1', N'C', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'10', 2824815),
( N'1', N'D', N'R', 58.1300, 625.7113, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'10', 2824816),
( N'1', N'E', N'R', 58.1300, 625.7113, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'10', 2824817),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'10', 2824818),
( N'1', N'A', N'R', 167.9200, 1807.4909, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'3', 2825352),
( N'1', N'B', N'R', 167.9200, 1807.4909, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'3', 2825353),
( N'1', N'C', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'3', 2825354),
( N'1', N'D', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'3', 2825355),
( N'1', N'E', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'3', 2825356),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'3', 2825357),
( N'1', N'A', N'C', 968.7600, 10427.7326, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'3', 2825358),
( N'1', N'B', N'C', 968.7600, 10427.7326, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'3', 2825359),
( N'1', N'C', N'C', 581.2600, 6256.6826, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'3', 2825360),
( N'1', N'D', N'C', 484.3800, 5213.8663, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'3', 2825361),
( N'1', N'E', N'C', 484.3800, 5213.8663, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'3', 2825362),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'3', 2825363),
( N'1', N'A', N'R', 342.3000, 3684.5172, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'3', 2825364),
( N'1', N'B', N'R', 342.3000, 3684.5172, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'3', 2825365),
( N'1', N'C', N'R', 206.6700, 2224.5959, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'3', 2825366),
( N'1', N'B', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'12', 2825367),
( N'1', N'D', N'R', 167.9200, 1807.4909, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'3', 2825368),
( N'1', N'E', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'12', 2825369),
( N'1', N'E', N'R', 167.9200, 1807.4909, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'3', 2825370),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'3', 2825371),
( N'1', N'B', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'4', 2825372),
( N'1', N'C', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'4', 2825373),
( N'1', N'D', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'4', 2825374),
( N'1', N'E', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'4', 2825375),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'4', 2825376),
( N'1', N'D', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'4', 2825377),
( N'1', N'A', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'4', 2825378),
( N'1', N'E', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'4', 2825379),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'4', 2825380),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'4', 2825381),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'4', 2825382),
( N'1', N'C', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'4', 2825383),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'4', 2825384),
( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'4', 2825385),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'4', 2825386),
( N'1', N'B', N'C', 387.5000, 4171.0500, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'4', 2825387),
( N'1', N'C', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'4', 2825388),
( N'1', N'D', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'4', 2825389),
( N'1', N'E', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'4', 2825390),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'4', 2825391),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'4', 2825392),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'4', 2825393),
( N'1', N'B', N'R', 135.6300, 1459.9213, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'12', 2825394),
( N'1', N'C', N'R', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'4', 2825395),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'4', 2825396),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'12', 2825397),
( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'4', 2825398),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'4', 2825399),
( N'1', N'D', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'12', 2825400),
( N'1', N'A', N'C', 387.5000, 4171.0500, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'4', 2825401),
( N'1', N'B', N'C', 387.5000, 4171.0500, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'4', 2825402),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'12', 2825403),
( N'1', N'C', N'C', 335.8400, 3614.9818, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'4', 2825404),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'12', 2825405),
( N'1', N'D', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'4', 2825406),
( N'1', N'E', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'4', 2825407),
( N'1', N'B', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'16', 2825408),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'4', 2825409),
( N'1', N'A', N'R', 135.6300, 1459.9213, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'4', 2825410),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'16', 2825411),
( N'1', N'B', N'R', 135.6300, 1459.9213, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'4', 2825412),
( N'1', N'C', N'R', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'4', 2825413),
( N'1', N'B', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'16', 2825414),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'4', 2825415),
( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'4', 2825416),
( N'1', N'E', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'16', 2825417),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'4', 2825418),
( N'1', N'B', N'C', 445.6300, 4796.7613, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'4', 2825419),
( N'1', N'B', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'16', 2825420),
( N'1', N'C', N'C', 335.8400, 3614.9818, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'4', 2825421),
( N'1', N'D', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'4', 2825422),
( N'1', N'E', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'16', 2825423),
( N'1', N'E', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'4', 2825424),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'4', 2825425),
( N'1', N'B', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'16', 2825426),
( N'1', N'A', N'R', 155.0000, 1668.4200, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'4', 2825427),
( N'1', N'E', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'16', 2825428),
( N'1', N'A', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'10', 2824819),
( N'1', N'B', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'10', 2824820),
( N'1', N'C', N'C', 122.7100, 1320.8504, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'10', 2824821),
( N'1', N'D', N'C', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'10', 2824822),
( N'1', N'E', N'C', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'10', 2824823),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'10', 2824824),
( N'1', N'A', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'10', 2824825),
( N'1', N'B', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'10', 2824826),
( N'1', N'C', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'10', 2824827),
( N'1', N'D', N'R', 58.1300, 625.7113, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'10', 2824828),
( N'1', N'E', N'R', 58.1300, 625.7113, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'10', 2824829),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'10', 2824830),
( N'1', N'A', N'C', 148.5400, 1598.8846, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'10', 2824831),
( N'1', N'B', N'C', 148.5400, 1598.8846, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'10', 2824832),
( N'1', N'C', N'C', 122.7100, 1320.8504, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'10', 2824833),
( N'1', N'D', N'C', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'10', 2824834),
( N'1', N'E', N'C', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'10', 2824835),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'10', 2824836),
( N'1', N'A', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'10', 2824837),
( N'1', N'B', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'10', 2824838),
( N'1', N'C', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'10', 2824839),
( N'1', N'D', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'10', 2824840),
( N'1', N'E', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'10', 2824841),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'10', 2824842),
( N'1', N'A', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'10', 2824843),
( N'1', N'B', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'10', 2824844),
( N'1', N'C', N'C', 206.6700, 2224.5959, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'10', 2824845),
( N'1', N'D', N'C', 180.8400, 1946.5618, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'10', 2824846),
( N'1', N'E', N'C', 180.8400, 1946.5618, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'10', 2824847),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'10', 2824848),
( N'1', N'A', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'10', 2824849),
( N'1', N'B', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'10', 2824850),
( N'1', N'C', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'10', 2824851),
( N'1', N'D', N'R', 71.0400, 764.6746, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'10', 2824852),
( N'1', N'E', N'R', 71.0400, 764.6746, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'10', 2824853),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'10', 2824854),
( N'1', N'A', N'C', 348.7500, 3753.9450, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'10', 2824855),
( N'1', N'B', N'C', 348.7500, 3753.9450, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'10', 2824856),
( N'1', N'C', N'C', 206.6700, 2224.5959, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'10', 2824857),
( N'1', N'D', N'C', 174.3800, 1877.0263, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'10', 2824858),
( N'1', N'E', N'C', 174.3800, 1877.0263, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'10', 2824859),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'10', 2824860),
( N'1', N'A', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'11', 2824861),
( N'1', N'B', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'11', 2824862),
( N'1', N'C', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'11', 2824863),
( N'1', N'D', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'11', 2824864),
( N'1', N'E', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'11', 2824865),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'11', 2824866),
( N'1', N'A', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'11', 2824867),
( N'1', N'B', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'11', 2824868),
( N'1', N'C', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'11', 2824869),
( N'1', N'D', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'11', 2824870),
( N'1', N'E', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'11', 2824871),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'11', 2824872),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'11', 2824873),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'11', 2824874),
( N'1', N'C', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'11', 2824875),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'11', 2824876),
( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'11', 2824877),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'11', 2824878),
( N'1', N'A', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'11', 2824879),
( N'1', N'B', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'11', 2824880),
( N'1', N'C', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'11', 2824881),
( N'1', N'D', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'11', 2824882),
( N'1', N'E', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'11', 2824883),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'11', 2824884),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'11', 2824885),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'11', 2824886),
( N'1', N'C', N'R', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'11', 2824887),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'11', 2824888),
( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'11', 2824889),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'11', 2824890),
( N'1', N'A', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'11', 2824891),
( N'1', N'B', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'11', 2824892),
( N'1', N'C', N'C', 271.2500, 2919.7350, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'11', 2824893),
( N'1', N'D', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'11', 2824894),
( N'1', N'A', N'C', 445.6300, 4796.7613, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'4', 2825429),
( N'1', N'B', N'R', 155.0000, 1668.4200, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'4', 2825430),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'12', 2825431),
( N'1', N'C', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'4', 2825432)
    ) AS v(
       
        TaxZoneNo,
        ConstructionCode,
        UseGroupCode,
        RateSquareMeter,
        RateSquareFeet,
        RateRemark,
        Col8,
        Col9,
        Col10,
        RateType,
        MinYear,
        MaxYear,
        RateSectionCode,
        OldId
    )
)



INSERT INTO PTIS.RateMaster
(
   
    TaxZoneId,
    FloorId,
    ConstructionTypeId,
    TypeOfUseGroupId,
    YearRangeRVId,
    RateSquareMeter,
    RateSquareFeet,
    RateSectionId,
    RateRemark,
    CreatedBy,
    UpdatedBy,
    UpdatedDate
)


SELECT

   
    tz.Id,
    f.Id,
    ct.Id,
    ug.Id,
    yr.Id,
    CAST(s.RateSquareMeter AS money),
    CAST(s.RateSquareFeet  AS money),
    rs.Id,
    s.RateRemark,
    NULL, NULL, NULL
FROM Seed s
JOIN PTIS.TaxZoneMaster tz
    ON tz.TaxZoneNo = s.TaxZoneNo
JOIN PTIS.FloorMaster f
    ON f.FloorCode = 'G'
JOIN PTIS.ConstructionTypeMaster ct
    ON ct.ConstructionCode = s.ConstructionCode
JOIN PTIS.TypeOfUseGroupMaster ug
    ON ug.TypeOfUseGroupCode = s.UseGroupCode
JOIN PTIS.RateSectionMaster rs
    ON rs.RateSectionNo = s.RateSectionCode
-- Match the range on FromYear only (the key the AssessmentYearRangeMasterRV MERGE above uses): the
-- current range is seeded as 2016-2026 but these rows carry 2016-2025, so an exact FromYear + ToYear
-- match silently dropped every current-range rate and RV was 0 for any property assessed after 2015.
-- That join can match at most one range per row because FromYear is unique in the table
-- (UQ_AssessmentYearRangeMasterRV_FromYear): two ranges starting in the same year would overlap.
JOIN PTIS.AssessmentYearRangeMasterRV yr
    ON yr.FromYear = s.MinYear;




	;WITH Seed AS
(
    SELECT
        
        v.TaxZoneNo,
        v.ConstructionCode,
        v.UseGroupCode,
        v.RateSquareMeter,
        v.RateSquareFeet,
        v.RateRemark,
        v.Col8,
        v.Col9,
        v.Col10,
        v.RateType,      
        v.MinYear,
        v.MaxYear,
        v.RateSectionId,
        v.OldId            
    FROM (VALUES
    ( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'12', 2825433),
( N'1', N'D', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'4', 2825434),
( N'1', N'E', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'4', 2825435),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'16', 2825436),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'4', 2825437),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'16', 2825438),
( N'1', N'E', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'4', 2825439),
( N'1', N'C', N'C', 238.9600, 2572.1654, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'16', 2825440),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'6', 2825441),
( N'1', N'A', N'R', 206.6700, 2224.5959, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'6', 2825442),
( N'1', N'D', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'17', 2825443),
( N'1', N'E', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'17', 2825444),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'17', 2825445),
( N'1', N'A', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'17', 2825446),
( N'1', N'B', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'17', 2825447),
( N'1', N'C', N'C', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'17', 2825448),
( N'1', N'D', N'C', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'17', 2825449),
( N'1', N'E', N'C', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'17', 2825450),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'17', 2825451),
( N'1', N'A', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'17', 2825452),
( N'1', N'B', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'17', 2825453),
( N'1', N'C', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'17', 2825454),
( N'1', N'D', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'17', 2825455),
( N'1', N'E', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'17', 2825456),
( N'1', N'D', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'12', 2825457),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'17', 2825458),
( N'1', N'A', N'C', 155.0000, 1668.4200, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'17', 2825459),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'12', 2825460),
( N'1', N'B', N'C', 155.0000, 1668.4200, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'17', 2825461),
( N'1', N'C', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'17', 2825462),
( N'1', N'D', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'17', 2825463),
( N'1', N'E', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'17', 2825464),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'17', 2825465),
( N'1', N'A', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'17', 2825466),
( N'1', N'B', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'17', 2825467),
( N'1', N'C', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'17', 2825468),
( N'1', N'D', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'17', 2825469),
( N'1', N'E', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'17', 2825470),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'17', 2825471),
( N'1', N'A', N'C', 155.0000, 1668.4200, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'17', 2825472),
( N'1', N'B', N'C', 155.0000, 1668.4200, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'17', 2825473),
( N'1', N'C', N'C', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'17', 2825474),
( N'1', N'D', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'17', 2825475),
( N'1', N'E', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'17', 2825476),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'17', 2825477),
( N'1', N'A', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'17', 2825478),
( N'1', N'B', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'17', 2825479),
( N'1', N'C', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'17', 2825480),
( N'1', N'D', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'17', 2825481),
( N'1', N'E', N'R', 51.6700, 556.1759, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'17', 2825482),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'17', 2825483),
( N'1', N'A', N'C', 180.8400, 1946.5618, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'17', 2825484),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'12', 2825485),
( N'1', N'B', N'C', 180.8400, 1946.5618, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'17', 2825486),
( N'1', N'C', N'C', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'17', 2825487),
( N'1', N'C', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'16', 2825488),
( N'1', N'D', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'17', 2825489),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'16', 2825490),
( N'1', N'E', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'17', 2825491),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'17', 2825492),
( N'1', N'C', N'C', 238.9600, 2572.1654, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'16', 2825493),
( N'1', N'A', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'17', 2825494),
( N'1', N'B', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'17', 2825495),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'16', 2825496),
( N'1', N'C', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'17', 2825497),
( N'1', N'C', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'16', 2825498),
( N'1', N'D', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'17', 2825499),
( N'1', N'E', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'17', 2825500),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'16', 2825501),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'17', 2825502),
( N'1', N'B', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'17', 2825503),
( N'1', N'C', N'C', 206.6700, 2224.5959, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'17', 2825504),
( N'1', N'E', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'11', 2824895),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'11', 2824896),
( N'1', N'A', N'R', 135.6300, 1459.9213, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'11', 2824897),
( N'1', N'B', N'R', 135.6300, 1459.9213, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'11', 2824898),
( N'1', N'C', N'R', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'11', 2824899),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'11', 2824900),
( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'11', 2824901),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'11', 2824902),
( N'1', N'A', N'C', 374.5900, 4032.0868, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'11', 2824903),
( N'1', N'B', N'C', 374.5900, 4032.0868, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'11', 2824904),
( N'1', N'C', N'C', 271.2500, 2919.7350, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'11', 2824905),
( N'1', N'D', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'11', 2824906),
( N'1', N'E', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'11', 2824907),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'11', 2824908),
( N'1', N'A', N'R', 167.9200, 1807.4909, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'11', 2824909),
( N'1', N'B', N'R', 167.9200, 1807.4909, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'11', 2824910),
( N'1', N'C', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'11', 2824911),
( N'1', N'D', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'11', 2824912),
( N'1', N'E', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'11', 2824913),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'11', 2824914),
( N'1', N'A', N'C', 516.6700, 5561.4359, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'11', 2824915),
( N'1', N'B', N'C', 516.6700, 5561.4359, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'11', 2824916),
( N'1', N'C', N'C', 413.3400, 4449.1918, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'11', 2824917),
( N'1', N'D', N'C', 361.6700, 3893.0159, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'11', 2824918),
( N'1', N'E', N'C', 361.6700, 3893.0159, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'11', 2824919),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'11', 2824920),
( N'1', N'A', N'R', 368.1300, 3962.5513, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'11', 2824921),
( N'1', N'B', N'R', 368.1300, 3962.5513, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'11', 2824922),
( N'1', N'C', N'R', 219.5900, 2363.6668, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'11', 2824923),
( N'1', N'D', N'R', 187.2900, 2015.9896, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'11', 2824924),
( N'1', N'E', N'R', 187.2900, 2015.9896, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'11', 2824925),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'11', 2824926),
( N'1', N'A', N'C', 936.4700, 10080.1631, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'11', 2824927),
( N'1', N'B', N'C', 936.4700, 10080.1631, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'11', 2824928),
( N'1', N'C', N'C', 561.8800, 6048.0763, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'11', 2824929),
( N'1', N'D', N'C', 471.4600, 5074.7954, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'11', 2824930),
( N'1', N'E', N'C', 471.4600, 5074.7954, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'11', 2824931),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'11', 2824932),
( N'1', N'A', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'12', 2824933),
( N'1', N'B', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'12', 2824934),
( N'1', N'C', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'12', 2824935),
( N'1', N'D', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'12', 2824936),
( N'1', N'E', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'12', 2824937),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'12', 2824938),
( N'1', N'A', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'12', 2824939),
( N'1', N'B', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'12', 2824940),
( N'1', N'C', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'12', 2824941),
( N'1', N'D', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'12', 2824942),
( N'1', N'E', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'12', 2824943),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'12', 2824944),
( N'1', N'B', N'R', 167.9200, 1807.4909, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'12', 2824945),
( N'1', N'C', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'12', 2824946),
( N'1', N'D', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'12', 2824947),
( N'1', N'E', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'12', 2824948),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'12', 2824949),
( N'1', N'A', N'C', 645.8400, 6951.8218, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'12', 2824950),
( N'1', N'B', N'C', 645.8400, 6951.8218, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'12', 2824951),
( N'1', N'C', N'C', 516.6700, 5561.4359, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'12', 2824952),
( N'1', N'D', N'C', 452.0900, 4866.2968, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'12', 2824953),
( N'1', N'E', N'C', 452.0900, 4866.2968, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'12', 2824954),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'12', 2824955),
( N'1', N'A', N'R', 342.3000, 3684.5172, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'12', 2824956),
( N'1', N'B', N'R', 342.3000, 3684.5172, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'12', 2824957),
( N'1', N'C', N'R', 206.6700, 2224.5959, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'12', 2824958),
( N'1', N'D', N'R', 167.9200, 1807.4909, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'12', 2824959),
( N'1', N'E', N'R', 167.9200, 1807.4909, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'12', 2824960),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'12', 2824961),
( N'1', N'B', N'C', 1020.4300, 10983.9085, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'12', 2824962),
( N'1', N'C', N'C', 613.5500, 6604.2522, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'12', 2824963),
( N'1', N'D', N'C', 510.2100, 5491.9004, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'12', 2824964),
( N'1', N'E', N'C', 510.2100, 5491.9004, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'12', 2824965),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'12', 2824966),
( N'1', N'A', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'13', 2824967),
( N'1', N'B', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'13', 2824968),
( N'1', N'C', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'13', 2824969),
( N'1', N'D', N'R', 64.5800, 695.1391, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'13', 2824970),
( N'1', N'C', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'16', 2825505),
( N'1', N'D', N'C', 180.8400, 1946.5618, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'17', 2825506),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'16', 2825507),
( N'1', N'E', N'C', 180.8400, 1946.5618, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'17', 2825508),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'17', 2825509),
( N'1', N'C', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'12', 2825510),
( N'1', N'A', N'R', 232.5000, 2502.6300, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'17', 2825511),
( N'1', N'A', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'17', 2825512),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'12', 2825513),
( N'1', N'C', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'12', 2825514),
( N'1', N'B', N'R', 232.5000, 2502.6300, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'17', 2825515),
( N'1', N'C', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'17', 2825516),
( N'1', N'D', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'17', 2825517),
( N'1', N'E', N'R', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'17', 2825518),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'17', 2825519),
( N'1', N'A', N'C', 568.3400, 6117.6118, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'17', 2825520),
( N'1', N'B', N'C', 568.3400, 6117.6118, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'17', 2825521),
( N'1', N'C', N'C', 342.3000, 3684.5172, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'17', 2825522),
( N'1', N'D', N'C', 284.1700, 3058.8059, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'17', 2825523),
( N'1', N'C', N'R', 90.4200, 973.2809, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'16', 2825524),
( N'1', N'E', N'C', 284.1700, 3058.8059, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'17', 2825525),
( N'1', N'D', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'16', 2825526),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2016, 2025, N'17', 2825527),
( N'1', N'D', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'1', 2825528),
( N'1', N'C', N'R', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'12', 2825529),
( N'1', N'E', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'1', 2825530),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'1', 2825531),
( N'1', N'A', N'C', 374.5900, 4032.0868, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'12', 2825532),
( N'1', N'B', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'9', 2825533),
( N'1', N'E', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'12', 2825534),
( N'1', N'C', N'C', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'9', 2825535),
( N'1', N'C', N'R', 96.8800, 1042.8163, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'12', 2825536),
( N'1', N'D', N'C', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'9', 2825537),
( N'1', N'E', N'C', 116.2500, 1251.3150, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'9', 2825538),
( N'1', N'A', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'12', 2825539),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'9', 2825540),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'1', 2825541),
( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'1', 2825542),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'1', 2825543),
( N'1', N'C', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'1', 2825544),
( N'1', N'D', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'1', 2825545),
( N'1', N'E', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'1', 2825546),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'1', 2825547),
( N'1', N'A', N'C', 594.1700, 6395.6459, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'1', 2825548),
( N'1', N'B', N'C', 594.1700, 6395.6459, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'1', 2825549),
( N'1', N'C', N'C', 419.8000, 4518.7272, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'1', 2825550),
( N'1', N'B', N'R', 161.4600, 1737.9554, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'1', 2825551),
( N'1', N'C', N'R', 103.3300, 1112.2441, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'1', 2825552),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'1', 2825553),
( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'1', 2825554),
( N'1', N'E', N'C', 193.7500, 2085.5250, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'16', 2825555),
( N'1', N'C', N'C', 419.8000, 4518.7272, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'1', 2825556),
( N'1', N'A', N'R', 77.5000, 834.2100, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'10', 2825557),
( N'1', N'D', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'1', 2825558),
( N'1', N'A', N'C', 129.1700, 1390.3859, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'9', 2825559),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'12', 2825560),
( N'1', N'E', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'1', 2825561),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'1', 2825562),
( N'1', N'B', N'C', 374.5900, 4032.0868, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'12', 2825563),
( N'1', N'A', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'1', 2825564),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'2', 2825565),
( N'1', N'C', N'C', 258.3400, 2780.7718, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'2', 2825566),
( N'1', N'E', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'1', 2825567),
( N'1', N'OP', N'C', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'12', 2825568),
( N'1', N'OP', N'R', 0.0000, 0.0000, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'1', 2825569),
( N'1', N'C', N'C', 290.6300, 3128.3413, N'G', NULL, NULL, NULL, N'YearWise Rate', 1998, 1998, N'2', 2825570),
( N'1', N'A', N'R', 161.4600, 1737.9554, N'G', NULL, NULL, NULL, N'YearWise Rate', 2003, 2004, N'1', 2825571),
( N'1', N'D', N'R', 83.9600, 903.7454, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'12', 2825572),
( N'1', N'B', N'C', 645.8400, 6951.8218, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'4', 2825573),
( N'1', N'C', N'R', 167.9200, 1807.4909, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'1', 2825574),
( N'1', N'C', N'C', 516.6700, 5561.4359, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'4', 2825575),
( N'1', N'B', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'12', 2825576),
( N'1', N'E', N'C', 226.0400, 2433.0946, N'G', NULL, NULL, NULL, N'YearWise Rate', 1999, 2002, N'12', 2825577),
( N'1', N'D', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'1', 2825578),
( N'1', N'A', N'C', 322.9200, 3475.9109, N'G', NULL, NULL, NULL, N'YearWise Rate', 1700, 1997, N'4', 2825579),
( N'1', N'E', N'R', 142.0800, 1529.3491, N'G', NULL, NULL, NULL, N'YearWise Rate', 2005, 2015, N'1', 2825580)
    ) AS v(
       
        TaxZoneNo,
        ConstructionCode,
        UseGroupCode,
        RateSquareMeter,
        RateSquareFeet,
        RateRemark,
        Col8,
        Col9,
        Col10,
        RateType,
        MinYear,
        MaxYear,
        RateSectionId,
        OldId
    )
)



INSERT INTO PTIS.RateMaster
(
   
    TaxZoneId,
    FloorId,
    ConstructionTypeId,
    TypeOfUseGroupId,
    YearRangeRVId,
    RateSquareMeter,
    RateSquareFeet,
    RateSectionId,
    RateRemark,
    CreatedBy,
    UpdatedBy,
    UpdatedDate
)


SELECT

    
    tz.Id,
    f.Id,
    ct.Id,
    ug.Id,
    yr.Id,
    CAST(s.RateSquareMeter AS money),
    CAST(s.RateSquareFeet  AS money),
    rs.Id,
    s.RateRemark,
    NULL, NULL, NULL
FROM Seed s
JOIN PTIS.TaxZoneMaster tz
    ON tz.TaxZoneNo = s.TaxZoneNo
JOIN PTIS.FloorMaster f
    ON f.FloorCode = 'G'
JOIN PTIS.ConstructionTypeMaster ct
    ON ct.ConstructionCode = s.ConstructionCode
JOIN PTIS.TypeOfUseGroupMaster ug
    ON ug.TypeOfUseGroupCode = s.UseGroupCode
JOIN PTIS.RateSectionMaster rs
    ON rs.RateSectionNo = s.RateSectionId
-- FromYear-only range match, same reason as the RateMaster insert above (2016-2025 rows vs the 2016-2026 range), and safe for the
-- same reason: FromYear is unique in AssessmentYearRangeMasterRV.
JOIN PTIS.AssessmentYearRangeMasterRV yr
    ON yr.FromYear = s.MinYear;




;WITH Src AS
(
    SELECT v.RateSectionNo, v.WardNo
    FROM (VALUES
          (N'1',  N'NK10'),
         (N'1',  N'NK11'),
         (N'1',  N'NK12'),
         (N'1',  N'NK131'),
         (N'1',  N'NK132'),
         (N'1',  N'NK133'),
         (N'1',  N'NK134'),
         (N'1',  N'NK135'),
         (N'1',  N'NK136'),
         (N'1',  N'NKMAJOR3'),
         (N'1',  N'UT115'),
         (N'1',  N'UT116'),
         (N'1',  N'UT117'),
         (N'1',  N'UT118'),
         (N'1',  N'UT119'),
         (N'1',  N'UT120'),
         (N'1',  N'UT121'),
         (N'1',  N'UT122'),
         (N'1',  N'UT123'),
         (N'1',  N'UT124'),
         (N'1',  N'UT125'),
         (N'1',  N'UT126'),
         (N'1',  N'UT127'),
         (N'1',  N'UT128'),
         (N'1',  N'UT129'),
         (N'1',  N'UT130'),
         (N'1',  N'UTMAJOR2'),
         (N'10', N'DI175'),
         (N'10', N'DI176'),
         (N'10', N'DIMAJOR1'),
         (N'11', N'LSMAJOR1'),
         (N'11', N'NK1'),
         (N'11', N'NK2'),
         (N'11', N'NK3'),
         (N'11', N'NK33'),
         (N'11', N'NK34'),
         (N'11', N'NK35'),
         (N'11', N'NK37'),
         (N'11', N'NK40'),
         (N'11', N'NKMAJOR4'),
         (N'11', N'WE13'),
         (N'11', N'WE36'),
         (N'11', N'WE41'),
         (N'11', N'WE42'),
         (N'11', N'WE43'),
         (N'11', N'WE44'),
         (N'11', N'WE45'),
         (N'11', N'WE46'),
         (N'11', N'WE47'),
         (N'11', N'WE48'),
         (N'11', N'WE49'),
         (N'11', N'WE50'),
         (N'11', N'WE51'),
         (N'11', N'WE52'),
         (N'11', N'WE53'),
         (N'11', N'WE54'),
         (N'11', N'WE55'),
         (N'11', N'WE56'),
         (N'11', N'WE57'),
         (N'11', N'WE58'),
         (N'11', N'WE59'),
         (N'11', N'WE63'),
         (N'11', N'WE64'),
         (N'11', N'WEMAJOR1'),
         (N'12', N'VN112'),
         (N'12', N'VN113'),
         (N'12', N'VN6'),
         (N'12', N'VN78'),
         (N'12', N'VN8'),
         (N'12', N'VN85'),
         (N'12', N'VN86'),
         (N'12', N'VN88'),
         (N'12', N'VN89'),
         (N'12', N'VN90'),
         (N'12', N'VN91'),
         (N'12', N'VN92'),
         (N'12', N'VN93'),
         (N'12', N'VN94'),
         (N'12', N'VN95'),
         (N'12', N'VNMAJOR'),
         (N'13', N'MM111'),
         (N'13', N'MM114'),
         (N'13', N'MM19'),
         (N'13', N'MM20'),
         (N'14', N'MM106'),
         (N'14', N'MM107'),
         (N'14', N'MM109'),
         (N'14', N'MM110'),
         (N'14', N'MM15'),
         (N'14', N'MM16'),
         (N'14', N'MM18'),
         (N'14', N'MMMAJOR4'),
         (N'15', N'MM10'),
         (N'15', N'MM101'),
         (N'15', N'MM102'),
         (N'15', N'MM103'),
         (N'15', N'MM104'),
         (N'15', N'MM105'),
         (N'15', N'MM13'),
         (N'15', N'MM8'),
         (N'15', N'MMMAJOR3'),
         (N'16', N'MM108'),
         (N'16', N'MM11'),
         (N'16', N'MMMAJOR2'),
         (N'17', N'MM1'),
         (N'17', N'MM100'),
         (N'17', N'MM2'),
         (N'17', N'MM3'),
         (N'17', N'MM4'),
         (N'17', N'MM5'),
         (N'17', N'MM7'),
         (N'17', N'MM96'),
         (N'17', N'MM97'),
         (N'17', N'MM98'),
         (N'17', N'MM99'),
         (N'17', N'MMMAJOR'),
         (N'2',  N'NK13'),
         (N'2',  N'NK14'),
         (N'2',  N'NK15'),
         (N'2',  N'NK16'),
         (N'2',  N'NK17'),
         (N'2',  N'NK18'),
         (N'2',  N'NK19'),
         (N'2',  N'NK20'),
         (N'2',  N'NK25'),
         (N'2',  N'NK26'),
         (N'2',  N'NK27'),
         (N'2',  N'NK28'),
         (N'2',  N'NK29'),
         (N'2',  N'NK30'),
         (N'2',  N'NK31'),
         (N'2',  N'NK32'),
         (N'2',  N'NK8'),
         (N'2',  N'NK9'),
         (N'2',  N'NKMAJOR1'),
         (N'2',  N'UTMAJOR1'),
         (N'3',  N'NK5'),
         (N'3',  N'NK6'),
         (N'3',  N'NK7'),
         (N'3',  N'NKMAJOR2'),
         (N'4',  N'KL137'),
         (N'4',  N'KL138'),
         (N'4',  N'KL142'),
         (N'4',  N'KL143'),
         (N'4',  N'KL144'),
         (N'4',  N'KL145'),
         (N'4',  N'KL146'),
         (N'4',  N'KL147'),
         (N'4',  N'KL148'),
         (N'4',  N'KL149'),
         (N'4',  N'KL150'),
         (N'4',  N'KL151'),
         (N'4',  N'KLMAJOR2'),
         (N'5',  N'KL139'),
         (N'5',  N'KL140'),
         (N'5',  N'KL141'),
         (N'5',  N'KLMAJOR1'),
         (N'5',  N'TEST'),
         (N'6',  N'KL152'),
         (N'6',  N'KL153'),
         (N'6',  N'KL154'),
         (N'6',  N'KL155'),
         (N'6',  N'KL156'),
         (N'6',  N'KLMAJOR3'),
         (N'7',  N'MU157'),
         (N'7',  N'MU158'),
         (N'7',  N'MU159'),
         (N'7',  N'MU160'),
         (N'7',  N'MU163'),
         (N'7',  N'MU164'),
         (N'7',  N'MU165'),
         (N'7',  N'MU166'),
         (N'7',  N'MU167'),
         (N'7',  N'MU168'),
         (N'7',  N'MUMAJOR1'),
         (N'8',  N'MUMAJOR2'),
         (N'8',  N'MUMAJOR3'),
         (N'9',  N'DI172'),
         (N'9',  N'DI174'),
         (N'9',  N'DIMAJOR2'),
         (N'9',  N'MUMAJOR4')
    ) v(RateSectionNo, WardNo)
),
Resolved AS
(
    SELECT
        rsm.Id AS RateSectionId,
        wm.Id AS WardId,
        s.RateSectionNo,
        s.WardNo
    FROM Src s
    INNER JOIN PTIS.RateSectionMaster rsm
        ON rsm.RateSectionNo = TRY_CONVERT(int, s.RateSectionNo)
    INNER JOIN PTIS.WardMaster wm
        ON wm.WardNo = s.WardNo
)
INSERT INTO PTIS.RateSectionDetails (RateSectionId, WardId)
SELECT r.RateSectionId, r.WardId
FROM Resolved r
WHERE NOT EXISTS
(
    SELECT 1
    FROM PTIS.RateSectionDetails t
    WHERE t.RateSectionId = r.RateSectionId
      AND t.WardId        = r.WardId
);




	

-- SET IDENTITY_INSERT [PTIS].[ActiveTaxesMaster] ON;
-- GO

-- INSERT [PTIS].[ActiveTaxesMaster]
-- ([ActiveTaxesId], [TaxName], [TaxNameAlias], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate])
-- VALUES
-- (1,  N'GeneralTax',           N'सामान्य कर रु.',                    1,  1, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (2,  N'StateEducationTax',    N'शिक्षण कर रु.',                      2,  1, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (3,  N'StateEmploymentTax',   N'रोजगार हमी कर रु.',                  3,  1, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (4,  N'SpEducationTax',       N'शिक्षण उपकर रु.',                    4,  1, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (5,  N'DrainCess',            N'घ.क शु. रु.',                       5,  1, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (6,  N'RoadCess',             N'रस्ता कर रु.',                       6,  1, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (7,  N'TreeCess',             N'वृक्ष उपकर रु.',                     7,  1, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (8,  N'SewageDisposalCess',   N'मलप्रवाह सुविधा लाभ कर रु.',         8,  1, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (9,  N'SanitationCess',       N'प्रशासकीय सेवा शुल्क रु.',           9,  1, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (10, N'WaterBenefitCess',     N'पाणीपुरवठा लाभ कर रु.',             10, 0, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (11, N'SpWaterCess',          N'मल निस्सा रण लाभ रु.',              11, 1, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (12, N'WaterBill',            N'मागणी नोटीस फी रु.',                12, 0, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (13, N'FireCess',             N'अग्नि. कर रु.',                      13, 1, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (14, N'Penalty',              N'थकीत शास्ती रु.',                    14, 1, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (15, N'BigBuilding',          N'मोठी इमारत कर रु.',                  15, 0, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (16, N'LightCess',            N'विशेष साफसफाई कर रु.',              16, 1, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (17, N'ServiceTax',           N' ',                                  17, 1, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (19, N'IllegalConstPenalty',  N'अनधिकृत बांध काम शास्ती रु. ',      18, 1, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (20, N'Tax1',                 N'कर १ रु.',                           19, 1, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (21, N'Tax2',                 N'कर २ रु.',                           20, 1, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (22, N'Tax3',                 N'कर ४ रु..',                          21, 1, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (23, N'Tax4',                 N'कर ४ रु.',                           22, 0, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (24, N'Tax5',                 N'कर ५ रु.',                           23, 0, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (25, N'Tax6',                 N'कर ५ रु.',                           24, 0, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (26, N'Tax7',                 N'कर ६ रु.',                           25, 0, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (27, N'Tax8',                 N'कर ७ रु.',                           26, 0, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (28, N'Tax9',                 N'कर ९ रु.',                           27, 0, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (29, N'Tax10',                N'कर १० रु.',                          28, 0, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (30, N'Interest',             N'चालू मा.कर शास्ती रु.',              29, 0, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (31, N'Discount',             N'विशेष सूट रु.',                      30, 0, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (32, N'TaxTotal',             N'एकूण कर रु.',                         31, 1, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL),
-- (33, N'NetTotal',             N'निव्वळ एकूण कर रु.',                  32, 1, NULL, CAST(N'2026-01-28T15:29:24.287' AS DateTime), NULL, NULL);

-- GO
-- SET IDENTITY_INSERT [PTIS].[ActiveTaxesMaster] OFF;
GO



-- CORE.YearMaster: Year = the calendar year a finance year (1 April - 31 March) STARTS in. Every row is inserted
-- inactive; the finance year that is running when the database is created is switched on after the inserts (see below),
-- so the active year is never a hard-coded one that goes stale at the first April after it was written.
INSERT INTO [CORE].[YearMaster] ([Year], [IsActive]) VALUES ( '2022','0');
INSERT INTO [CORE].[YearMaster] ([Year], [IsActive]) VALUES ( '2023','0');
INSERT INTO [CORE].[YearMaster] ([Year], [IsActive]) VALUES ( '2024','0');
INSERT INTO [CORE].[YearMaster] ([Year], [IsActive]) VALUES ( '2025','0');

-- Finance years the Retrospective Tax engine needs: it prices every year from the certificate
-- date (as early as the 01-Apr-2016 cutoff) up to the current finance year, and throws
-- "No financial year master found for current finance year ..." when the current one is missing.
-- Nothing depends on the order these rows are inserted in: the test seed finds a year's row by its Year.
INSERT INTO [CORE].[YearMaster] ([Year], [IsActive]) VALUES ( '2016','0');
INSERT INTO [CORE].[YearMaster] ([Year], [IsActive]) VALUES ( '2017','0');
INSERT INTO [CORE].[YearMaster] ([Year], [IsActive]) VALUES ( '2018','0');
INSERT INTO [CORE].[YearMaster] ([Year], [IsActive]) VALUES ( '2019','0');
INSERT INTO [CORE].[YearMaster] ([Year], [IsActive]) VALUES ( '2020','0');
INSERT INTO [CORE].[YearMaster] ([Year], [IsActive]) VALUES ( '2021','0');
INSERT INTO [CORE].[YearMaster] ([Year], [IsActive]) VALUES ( '2026','0');
INSERT INTO [CORE].[YearMaster] ([Year], [IsActive]) VALUES ( '2027','0');
INSERT INTO [CORE].[YearMaster] ([Year], [IsActive]) VALUES ( '2028','0');
INSERT INTO [CORE].[YearMaster] ([Year], [IsActive]) VALUES ( '2029','0');
INSERT INTO [CORE].[YearMaster] ([Year], [IsActive]) VALUES ( '2030','0');

-- The active year is the finance year that is running now, worked out from the clock the way the API does it
-- (SystemFinanceYearProvider: April-December = this calendar year, January-March = the previous one). The engine, the
-- apartment tax screens and the no-dues certificate all read "the current finance year" from this flag, so it has to agree
-- with that provider. Exactly one row may be active (UX_YearMaster_OnlyOneActive): every row above is inactive, so
-- switching one on cannot collide with another.
DECLARE @RunningFinanceYear INT = CASE WHEN MONTH(GETDATE()) >= 4 THEN YEAR(GETDATE()) ELSE YEAR(GETDATE()) - 1 END;

-- A database created after the last explicitly seeded year needs every intervening finance year.
IF @RunningFinanceYear > 2030
BEGIN
    ;WITH MissingFinanceYears AS
    (
        SELECT 2031 AS [Year]
        UNION ALL
        SELECT [Year] + 1
        FROM MissingFinanceYears
        WHERE [Year] < @RunningFinanceYear
    )
    INSERT INTO [CORE].[YearMaster] ([Year], [IsActive])
    SELECT [Year], 0 FROM MissingFinanceYears
    OPTION (MAXRECURSION 0);
END;

UPDATE [CORE].[YearMaster] SET [IsActive] = 1 WHERE [Year] = @RunningFinanceYear;
GO


-- INSERT INTO PTIS.TaxPercentageMasterCV
-- (
--      TypeOfUseId,YearRangeCVId,GeneralTax,TreeCess, SpWaterCess,
--     RoadCess,FireCess,LightCess,WaterBenefitCess,SewageDisposalCess,SpEducationTax,
--     SanitationCess,DrainCess,WaterBill,BigBuilding,IllegalConstPenalty,
--     UserCharges,ServiceTax, Tax1, Tax2, Tax3, Tax4, Tax5, Tax6, Tax7, Tax8, Tax9, Tax10,
--     OldPenalty,IsActive,CreatedBy,CreatedDate,UpdatedBy, UpdatedDate
-- )
-- SELECT
    
--     tum.TypeOfUseId,
--     2,
--    15.0000, 1.0000, 2.0000, 5.0000, 0.0000, 0.0000, 10.0000, 8.0000, 1.0000,
--     0.0000, 1.0000, 0.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000,
--     1.0000, 1.0000, 0.0000, 0.0000, 10.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
--     1,   
--     NULL,
--     GETDATE(),
--     NULL,
--     NULL
-- FROM  PTIS.TypeOfUseMaster tum
   

-- SET IDENTITY_INSERT PTIS.TaxPercentageMasterCV OFF;




-- INSERT INTO PTIS.TaxPercentageMasterRV
-- (
--      TypeOfUseId,YearRangeRVId,GeneralTax,TreeCess, SpWaterCess,
--     RoadCess,FireCess,LightCess,WaterBenefitCess,SewageDisposalCess,SpEducationTax,
--     SanitationCess,DrainCess,WaterBill,BigBuilding,IllegalConstPenalty,
--     UserCharges,ServiceTax, Tax1, Tax2, Tax3, Tax4, Tax5, Tax6, Tax7, Tax8, Tax9, Tax10,
--     OldPenalty,IsActive,CreatedBy,CreatedDate,UpdatedBy, UpdatedDate
-- )
-- SELECT
    
--     tum.TypeOfUseId,
--     2,
--     15.0000, 1.0000, 2.0000, 5.0000, 0.0000, 0.0000, 10.0000, 8.0000, 1.0000,
--     0.0000, 1.0000, 0.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000,
--     1.0000, 1.0000, 0.0000, 0.0000, 10.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
--     1,   
--     NULL,
--     GETDATE(),
--     NULL,
--     NULL
-- FROM  PTIS.TypeOfUseMaster tum
   

-- SET IDENTITY_INSERT PTIS.TaxPercentageMasterRV OFF;












 GO
 SET IDENTITY_INSERT [PTIS].[GenderMaster] ON 
 GO
 INSERT [PTIS].[GenderMaster] ([Id], [GenderName]) VALUES (1, N'Female')
 GO
 INSERT [PTIS].[GenderMaster] ([Id], [GenderName]) VALUES (2, N'Male')
 GO
 INSERT [PTIS].[GenderMaster] ([Id], [GenderName]) VALUES (3, N'Transgender')
 GO
 INSERT [PTIS].[GenderMaster] ([Id], [GenderName]) VALUES (4,N'फर्म')
 GO
 SET IDENTITY_INSERT [PTIS].[GenderMaster] OFF



 SET IDENTITY_INSERT [PTIS].[DocumentMaster] ON 
 GO
 INSERT [PTIS].[DocumentMaster] ([Id], [DocumentName], [DocPrefix]) VALUES (1, N'Aadhar Card', N'ADR')
 GO
 INSERT [PTIS].[DocumentMaster] ([Id], [DocumentName], [DocPrefix]) VALUES (2, N'Index2', N'IND2')
 GO
 INSERT [PTIS].[DocumentMaster] ([Id], [DocumentName], [DocPrefix]) VALUES (4, N'Satbara Utara', N'712')
 GO
 INSERT [PTIS].[DocumentMaster] ([Id], [DocumentName], [DocPrefix]) VALUES (5, N'Kharidi Khat', N'KHAT')
 GO
 SET IDENTITY_INSERT [PTIS].[DocumentMaster] OFF


 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [Flag]) VALUES (N'कायम','SurveyApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [Flag]) VALUES (N'बाल्कनी close केली','SurveyApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [Flag]) VALUES (N'बाल्कनी close  होती  Open केली','SurveyApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [Flag]) VALUES (N'क्षेत्रफळात बदल','SurveyApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [Flag]) VALUES (N'वापरात बदल','SurveyApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [Flag]) VALUES (N'अतिरिक्त बांधकाम केले','SurveyApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [Flag]) VALUES (N'BHK बदल','SurveyApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [Flag]) VALUES (N'भाडे माहिती बदल','SurveyApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [Flag]) VALUES (N'बाह्य मोजणीचे अंतर्गत मोजणी केली','SurveyApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [Flag]) VALUES (N'मालमत्ता वगळणे','SurveyApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [Flag]) VALUES (N'इतर','SurveyApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [Flag]) VALUES (N'नव्याने सर्वेक्षण पूर्ण','SurveyApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [Flag]) VALUES (N'प्लॉट वर नवीन बांधकाम केले','SurveyApp')

 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [BillAcceptStatus], [Remark], [IsActive], [Flag]) VALUES (N'बिल वितरित करण्यात आले', N'Accept', N'Visited and Distributed',1,'BillApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [BillAcceptStatus], [Remark], [IsActive], [Flag]) VALUES (N'मालमत्ता बंद', N'Reject', N'Visited but Not Distributed',1,'BillApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [BillAcceptStatus], [Remark], [IsActive], [Flag]) VALUES (N'त्रुटी असल्यामुळे बिल स्वीकारू शकत नाही', N'Reject', N'Visited but Not Distributed',1,'BillApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [BillAcceptStatus], [Remark], [IsActive], [Flag]) VALUES (N'तक्रार केलेली आहे त्यामुळे बिल स्वीकारू शकत नाही', N'Reject', N'Visited but Not Distributed',1,'BillApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [BillAcceptStatus], [Remark], [IsActive], [Flag]) VALUES (N'बिल मान्य नाही त्यामुळे स्वीकारण्यात आले नाही', N'Reject', N'Visited but Not Distributed',1,'BillApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [BillAcceptStatus], [Remark], [IsActive], [Flag]) VALUES (N'कर धारक हजर नसल्यामुळे बिल स्वीकारण्यात आले नाही', N'Reject', N'Visited but Not Distributed',1,'BillApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [BillAcceptStatus], [Remark], [IsActive], [Flag]) VALUES (N'बिल सेक्रेटरीकडे सोपवली', N'Accept', N'Visited and Distributed',1,'BillApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [BillAcceptStatus], [Remark], [IsActive], [Flag]) VALUES (N'सोसायटीमध्ये बिल वितरित करू देण्यास नकार', N'Reject', N'Visited but Not Distributed',1,'BillApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [BillAcceptStatus], [Remark], [IsActive], [Flag]) VALUES (N'मालमत्ता मिळाली नाही', N'Reject', N'Not Distributed',1,'BillApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [BillAcceptStatus], [Remark], [IsActive], [Flag]) VALUES (N'मालमत्ता बंद (बिल चिटकवू देण्यास नकार)', N'Reject', N'Not Distributed',1,'BillApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [BillAcceptStatus], [Remark], [IsActive], [Flag]) VALUES (N'मालमत्ता बंद (बिल चिटकवण्यात आले )', N'Accept', N'Visited and Distributed',1,'BillApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [BillAcceptStatus], [Remark], [IsActive], [Flag]) VALUES (N'बिल दिले', N'Accept', N'Visited and Distributed', 1,'BillApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [BillAcceptStatus], [Remark], [IsActive], [Flag]) VALUES (N'मालमत्ता बंद / मालमत्तेस बिल चिटकवले', N'Accept', N'Visited and Distributed', 1,'BillApp')
 GO
 INSERT [PTIS].[PropertyVisitMeasurementMaster] ([PropertyVisitAndMeasurement], [BillAcceptStatus], [Remark], [IsActive], [Flag]) VALUES (N'बिल घेण्यास नकार', N'Reject', N'Not Distributed', 1,'BillApp')
 GO


 SET IDENTITY_INSERT [PTIS].[MobileScreenValidationMaster] ON 
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (1, N'Pilot', N'SocietyName', N'SocietyName', 1, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (2, N'Pilot', N'SecretoryName', N'SecretoryName', 2, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (3, N'Pilot', N'MobileNo', N'MobileNo', 3, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (4, N'Pilot', N'EmailID', N'EmailID', 4, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (5, N'Pilot', N'Address', N'Address', 5, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (6, N'Pilot', N'Pincode', N'Pincode', 6, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (7, N'Pilot', N'OwnerName', N'OwnerName', 7, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (8, N'Pilot', N'OccupierName', N'OccupierName', 8, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (9, N'Pilot', N'ShopName', N'ShopName', 9, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (10, N'Pilot', N'BuildingPhoto', N'BuildingPhoto', 10, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (11, N'Pilot', N'WingPhoto', N'WingPhoto', 11, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (12, N'Pilot', N'WingBoardPhoto', N'WingBoardPhoto', 12, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (13, N'SocietyCommon', N'SurveyNo', N'SurveyNo', 1, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (14, N'SocietyCommon', N'PlotNo', N'PlotNo', 2, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (15, N'SocietyCommon', N'BlockNo', N'BlockNo', 3, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (16, N'SocietyCommon', N'SocietyName', N'SocietyName', 4, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (17, N'SocietyCommon', N'SecretoryName', N'SecretoryName', 5, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (18, N'SocietyCommon', N'MobileNo', N'MobileNo', 6, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (19, N'SocietyCommon', N'EmailID', N'EmailID', 7, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (20, N'SocietyCommon', N'Address', N'Address', 8, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (21, N'SocietyCommon', N'Pincode', N'Pincode', 9, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (22, N'SocietyCommon', N'OCCertificate', N'OCCertificate', 10, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (23, N'SocietyCommon', N'OCDate', N'OCDate', 11, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (24, N'SocietyCommon', N'AminityArea', N'AminityArea', 12, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (25, N'SocietyCommon', N'BuildingPhoto', N'BuildingPhoto', 13, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (26, N'SocietyCommon', N'GreenProperty', N'GreenProperty', 14, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (27, N'SocietyCommon', N'BuildingYear', N'BuildingYear', 15, NULL, NULL, NULL, 0, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (28, N'WingCommon', N'SurveyNo', N'SurveyNo', 1, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (29, N'WingCommon', N'PlotNo', N'PlotNo', 2, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (30, N'WingCommon', N'BlockNo', N'BlockNo', 3, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (31, N'WingCommon', N'SocietyName', N'SocietyName', 4, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (32, N'WingCommon', N'SecretoryName', N'SecretoryName', 5, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (33, N'WingCommon', N'MobileNo', N'MobileNo', 6, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (34, N'WingCommon', N'EmailID', N'EmailID', 7, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (35, N'WingCommon', N'Address', N'Address', 8, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (36, N'WingCommon', N'Pincode', N'Pincode', 9, NULL, NULL, NULL, 0, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (37, N'WingCommon', N'OCCertificate', N'OCCertificate', 10, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (38, N'WingCommon', N'OCDate', N'OCDate', 11, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (39, N'WingCommon', N'AminityArea', N'AminityArea', 12, NULL, NULL, NULL, 0, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (40, N'WingCommon', N'BuildingPhoto', N'BuildingPhoto', 13, NULL, NULL, NULL, 0, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (41, N'WingCommon', N'GreenProperty', N'GreenProperty', 14, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (42, N'WingCommon', N'WingYear', N'WingYear', 15, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (43, N'WingGeneration', N'Year', N'Year', 1, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (44, N'IndividualCommon', N'SurveyNo', N'SurveyNo', 1, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (45, N'IndividualCommon', N'PlotNo', N'PlotNo', 2, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (46, N'IndividualCommon', N'MobileNo', N'MobileNo', 3, NULL, NULL, NULL, 0, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (47, N'IndividualCommon', N'EmailID', N'EmailID', 4, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (48, N'IndividualCommon', N'Address', N'Address', 5, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (49, N'IndividualCommon', N'Pincode', N'Pincode', 6, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (50, N'IndividualCommon', N'OwnerName', N'OwnerName', 7, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (51, N'IndividualCommon', N'OccupierName', N'OccupierName', 1, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (52, N'IndividualCommon', N'ShopName', N'ShopName', 9, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (53, N'IndividualCommon', N'BuildingPhoto', N'BuildingPhoto', 10, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (54, N'IndividualCommon', N'BlockNo', N'BlockNo', 11, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (55, N'IndividualCommon', N'Year', N'Year', 12, NULL, NULL, NULL, 0, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (56, N'IndividualCommon', N'TotalArea', N'TotalArea', 13, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (57, N'IndividualCommon', N'Photo', N'Photo', 14, NULL, NULL, NULL, 0, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (58, N'IndividualCommon', N'Sign', N'Sign', 15, NULL, NULL, NULL, 0, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (59, N'FlatCommon', N'OwnerName', N'OwnerName', 1, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (60, N'FlatCommon', N'OccupierName', N'OccupierName', 2, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (61, N'FlatCommon', N'ShopName', N'ShopName', 3, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (62, N'FlatCommon', N'MobileNo', N'MobileNo', 4, NULL, NULL, NULL, 0, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (63, N'FlatCommon', N'EmailID', N'EmailID', 5, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (64, N'FlatCommon', N'Photo', N'Photo', 6, NULL, NULL, NULL, 1, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (65, N'FlatCommon', N'Sign', N'Sign', 7, NULL, NULL, NULL, 0, 1)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (66, N'FlatCommon', N'FlatArea', N'FlatArea', 8, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (67, N'FlatCommon', N'AmenityDirectSubmission', N'AmenityDirectSubmission', 9, NULL, NULL, NULL, 0, 0)
 GO
 INSERT [PTIS].[MobileScreenValidationMaster] ([Id], [TabScreenName], [Flag], [Alias], [DefaultSequenceNo], [CreatedBy], [UpdatedBy], [UpdatedDate], [DefaultNumberingAccess], [DefaultSurveyAccess]) VALUES (68, N'IndividualCommon', N'DirectIndividualSubmission', N'DirectIndividualSubmission', 16, NULL, NULL, NULL, 0, 0)
 GO
 SET IDENTITY_INSERT [PTIS].[MobileScreenValidationMaster] OFF
 GO

 INSERT INTO PTIS.BlockMaster (WardId, BlockNo)
SELECT wm.Id, v.BlockNo
FROM (VALUES
 ('UT1', 1), ('UT1', 2), ('UT1', 3), ('UT1', 4), ('UT1', 5),
 ('UT1', 6), ('UT1', 7), ('UT1', 8), ('UT1', 9), ('UT1',10),
 ('UT1',11), ('UT1',12), ('UT1',13), ('UT1',14), ('UT1',15),
 ('UT1',16), ('UT1',17)
) v(WardNo, BlockNo)
JOIN PTIS.WardMaster wm
  ON wm.WardNo = v.WardNo;
 --- global master-- end---
 
 SET IDENTITY_INSERT [PTIS].[PolicyConfiguration] ON;

 INSERT INTO [PTIS].[PolicyConfiguration]
 (
    Id,
    PolicyCode, Category, DisplayName, Description,
    DataType, PolicyValue, DefaultValue,
    IsProtected, IsActive, Unit, AllowedValues, CreatedDate
 )
 SELECT
     v.Id,
     v.PolicyCode, v.Category, v.DisplayName, v.Description,
     v.DataType, v.PolicyValue, v.DefaultValue,
     v.IsProtected, v.IsActive, v.Unit, v.AllowedValues, v.CreatedDate
 FROM (VALUES
     (1, N'AssessmentYear', N'General', N'Assessment Base Year',
      N'Assessment base year for policy configuration.',
      N'INT', N'2010', N'2010', 1, 1, NULL, NULL, GETDATE()),
     (2, N'TaxCalculationMethod', N'Calculation', N'Tax Calculation Method',
      N'Purpose: Specifies which tax calculation method should be used. PolicyValue: RV=Rateable Value, CV=Capital Value. Example: RV.',
      N'VARCHAR', N'RV', N'RV', 1, 1, NULL, N'RV,CV', GETDATE()),

     (3, N'RateableValueAreaType', N'Calculation', N'Rateable Value Area Type',
       N'Determines the area type used for Rateable Value calculation. PolicyValue: CarpetArea or BuiltUpArea. Example: CarpetArea.',
      N'VARCHAR', N'BuiltUpArea', N'CarpetArea', 1, 1, NULL, 'CarpetArea,BuiltUpArea', GETDATE()),
      
     (4, N'EducationEmploymentTaxCalculationMethod', N'Calculation',
      N'Education / Employment Tax On RV or ALV',
      N'Controls Education and Employment Tax calculation on Rateable Value Or Annual Letting Value.',
      N'VARCHAR', N'RV', N'ALV', 1, 1, NULL, N'RV,ALV', GETDATE()),
     (5, N'ApplyMaintenance', N'Calculation', N'Apply Maintenance',
      N'Apply maintenance deduction during annual rental value or rateable value calculation.',
      N'BIT', N'1', N'1', 1, 1, NULL, 'Enable,Disable', GETDATE()),
     (6, N'MaintenancePercentage', N'Calculation', N'Maintenance Percentage',
      N'Percentage of maintenance deduction applied during annual rental value or rateable value calculation.',
      N'DECIMAL', N'10', N'10', 1, 1, N'PERCENT', NULL, GETDATE()),
     (7, N'RateMasterAreaUnit', N'Calculation', N'Rate Master Area Unit',
      N'Purpose: Defines whether Rate Master rates are entered per SqMeter or per SqFeet. PolicyValue: SqMeter or SqFeet. Example: SqMeter.',
      N'VARCHAR', N'SqMeter', N'SqMeter', 1, 1, NULL, N'SqMeter,SqFeet', GETDATE()),
     (8, N'RateMonthlyOrYearly', N'Calculation', N'Rate Monthly Or Yearly',
      N'Purpose: Determines whether Rate Master rates are monthly or yearly. PolicyValue: Monthly or Yearly. Example: Yearly.',
        N'VARCHAR', N'Yearly', N'Monthly', 1, 1, NULL, N'Monthly,Yearly', GETDATE()),
         (9, N'CombinePropertyLimit', N'Calculation', N'Combine Property Limit',
        N'Purpose: Specifies the maximum number of adjacent properties allowed for property combination. PolicyValue: Enter a numeric value. Example: 2 means a property can be combined with up to 2 adjacent properties.',
        N'INT', N'10', N'3', 1, 1, NULL, NULL, CAST(N'2026-06-16T16:26:35.227' AS DATETIME)),
         (10, N'MaxPropertyTransferLimit', N'Validation', N'Maximum Property Transfer Limit',
        N'Purpose: Updated maximum property transfer limit.',
        N'INT', N'8', N'5', 0, 1, NULL, NULL, CAST(N'2026-06-18T14:20:31.163' AS DATETIME)),
         (11, N'SECTION129_STAGE_BASE_TAXCODE', N'SECTION_129A', N'Section 129A Stage Base Tax Code',
        N'Purpose: Which PTIS.TaxMaster.TaxName the Section 129A 20/40/60/80/100 stage percentages are applied against. PolicyValue: "General Tax" or "Tax Total" (aggregate) — matched against TaxMaster.TaxName, not TaxCode. Example: General Tax.',
        N'VARCHAR', N'General Tax', N'General Tax', 0, 1, NULL, N'General Tax,Tax Total', GETDATE()),
         (13, N'UpicIdConfiguration', N'UpicIdBuilder', N'UPIC ID Builder Pattern Configuration',
        N'JSON configuration for UPIC ID structure and partition rules',
        N'VARCHAR', N'{"structure":[{"id":"f2","type":"field","field":"WardNo","prefix":"WN","sample":"4","padding":2,"paddingMode":"conditional","separator":"-","transform":"uppercase"},{"id":"f3","type":"field","field":"PropertyNo","prefix":"","sample":"14","padding":4,"paddingMode":"numeric","separator":"-","transform":"none"},{"id":"f4","type":"field","field":"PartitionNo","prefix":"","sample":"","padding":0,"paddingMode":"conditional","separator":"","transform":"uppercase"}],"partitionRules":{"apartment":{"sample":"A1","prefix":"","padding":2},"other":{"sample":"1","prefix":"IPsus","padding":2}},"updatedBy":1,"isActive":true}',
        N'{"structure":[{"id":"f2","type":"field","field":"WardNo","prefix":"W","sample":"4","padding":2,"paddingMode":"numeric","separator":"-","transform":"uppercase"},{"id":"f3","type":"field","field":"PropertyNo","prefix":"","sample":"14","padding":4,"paddingMode":"numeric","separator":"-","transform":"none"},{"id":"f4","type":"field","field":"PartitionNo","prefix":"","sample":"","padding":0,"paddingMode":"conditional","separator":"","transform":"uppercase"}],"partitionRules":{"apartment":{"sample":"A1","prefix":"","padding":2},"other":{"sample":"1","prefix":"IPrr","padding":2}}}',
        0, 1, NULL, NULL, CAST(N'2026-09-25T16:02:33.430' AS DATETIME))

  ) v
  (
      Id,
      PolicyCode, Category, DisplayName, Description,
      DataType, PolicyValue, DefaultValue,
      IsProtected, IsActive, Unit, AllowedValues, CreatedDate
  )
  WHERE NOT EXISTS (
      SELECT 1
      FROM [PTIS].[PolicyConfiguration] pc
      WHERE pc.PolicyCode = v.PolicyCode
  );

 SET IDENTITY_INSERT [PTIS].[PolicyConfiguration] OFF;

------------------------Section 129A ward-wise date master-----------------------
-- One row per real ward currently in PTIS.WardMaster (idempotent on WardId) — a single ward-wide
-- Area Inclusion Date. Placeholder date to prove the join path end-to-end; real per-ward dates
-- are a data-entry exercise for each ULB, not something this generic seed script can know.
INSERT INTO [PTIS].[WardSection129Master]
    (WardId, Section129AInclusionDate, CreatedDate)
SELECT w.Id, CAST(N'2020-04-01' AS DATE), GETDATE()
FROM [PTIS].[WardMaster] w
WHERE NOT EXISTS (
    SELECT 1 FROM [PTIS].[WardSection129Master] m WHERE m.WardId = w.Id
);

------------------------tax configuration-----------------------

SET IDENTITY_INSERT [PTIS].[TaxCategoryMaster] ON;

INSERT INTO [PTIS].[TaxCategoryMaster] ([Id], [CategoryCode], [CategoryName], [IsActive], [IsProtected], [CreatedBy])
SELECT v.Id, v.CategoryCode, v.CategoryName, v.IsActive, v.IsProtected, v.CreatedBy
FROM (VALUES
    (1, 'TAX',  'Tax', 1, 1, 1),
    (2, 'CESS', 'Cess', 1, 1, 1),
    (3, 'EDU',  'State Education Tax', 1, 1, 1),
    (4, 'EMP',  'State Employment Tax', 1, 1, 1),
    (5, 'USER', 'User Charges', 1, 1, 1),
    (6, 'PENALTY', 'Penalty', 1, 1, 1),
    (7, 'DISCOUNT', 'Discount', 1, 1, 1),
    (8, 'TAXTOTAL', 'Tax Total', 1, 1, 1),
    (9, 'NETTOTAL', 'Net Total', 1, 1, 1)
) v(Id, CategoryCode, CategoryName, IsActive, IsProtected, CreatedBy)
WHERE NOT EXISTS (
    SELECT 1 FROM [PTIS].[TaxCategoryMaster] tcm WHERE tcm.[Id] = v.[Id]
);

SET IDENTITY_INSERT [PTIS].[TaxCategoryMaster] OFF;

GO

SET IDENTITY_INSERT [PTIS].[TaxCalculationModeMaster] ON;
INSERT INTO [PTIS].[TaxCalculationModeMaster] ([Id],[ModeCode],[ModeName],[DisplayOrder],[UsesValueConfig],[UsesConditionConfig],[UsesMasterConfig],[UsesHybridConfig],[CreatedDate],[UpdatedDate],[CreatedBy],[UpdatedBy],[IsActive])
VALUES
    (1,'VALUE_BASED',     'Value Based',     1, 1, 0, 0, 0, GETDATE(), NULL, 1, NULL, 1),
    (2,'CONDITION_BASED', 'Condition Based', 2, 0, 1, 0, 0, GETDATE(), NULL, 1, NULL, 1),
    (3,'MASTER_BASED',    'Master Based',    3, 0, 0, 1, 0, GETDATE(), NULL, 1, NULL, 1),
    (4,'HYBRID',          'Hybrid',          4, 0, 1, 1, 1, GETDATE(), NULL, 1, NULL, 1)
GO
SET IDENTITY_INSERT [PTIS].[TaxCalculationModeMaster] OFF;
GO


SET IDENTITY_INSERT [PTIS].[TaxMaster] ON;

INSERT INTO [PTIS].[TaxMaster] ([Id], [TaxCode], [TaxName], [TaxCategoryId], [DisplayOrder], [IsActive], [AssessmentStatus], [OldTaxStatus], [IsProtected], [CalculationModeId])
SELECT v.Id, v.TaxCode, v.TaxName, c.Id, v.DisplayOrder, v.IsActive, v.AssessmentStatus, v.OldTaxStatus, v.IsProtected, v.CalculationModeId
FROM (VALUES
    (1, 'GEN',  'General Tax',              'TAX',  1, 1, 1, 1, 1, 1),
    (2, 'STATE_EDU', 'State Education Tax','EDU',  2, 1, 1, 1, 1, 1),
    (3, 'STATE_EMP', 'State Employment Tax','EMP', 3, 1, 1, 1, 1, 1),
    (4, 'TREE', 'Tree Cess',               'CESS', 4, 1, 1, 1, 1, 1),
    (5, 'SP_WATER', 'Special Water Cess',  'CESS', 5, 1, 1, 1, 1, 1),
    (6, 'ROAD', 'Road Cess',               'CESS', 6, 1, 1, 1, 1, 1),
    (7, 'FIRE', 'Fire Cess',               'CESS', 7, 1, 1, 1, 1, 1),
    (8, 'LIGHT', 'Light Cess',             'CESS', 8, 1, 1, 1, 1, 1),
    (9, 'WATER_BEN', 'Water Benefit Cess', 'CESS', 9, 1, 1, 1, 1, 1),
    (10, 'SEWAGE', 'Sewage Disposal Cess',  'CESS', 10, 1, 1, 1, 1, 1),
    (11, 'SP_EDU', 'Special Education Tax', 'EDU',  11, 1, 1, 1, 1, 1),
    (12, 'SANITATION', 'Sanitation Cess',   'CESS', 12, 0, 0, 0, 1, 1),
    (13, 'DRAIN', 'Drain Cess',             'CESS', 13, 0, 0, 0, 1, 1),
    (14, 'WATER_BILL', 'Water Bill',        'USER', 14, 0, 0, 0, 1, 1),
    (15, 'BIG_BUILD', 'Big Building',       'TAX',  15, 0, 0, 0, 1, 1),
    (16, 'ILLEGAL', 'Illegal Construction Penalty','PENALTY',16, 0, 0, 0, 1, 1),
    (17, 'USER', 'User Charges',            'USER', 17, 0, 0, 0, 1, 1),
    (18, 'SERVICE', 'Service Tax',          'TAX',  18, 0, 0, 0, 1, 1),
    (19, 'OLD PENALTY', 'Old Penalty of ULB', 'PENALTY',  19, 0, 0, 0, 1, 1),
    (20, 'PENALTY', 'Run Time Penalty', 'PENALTY',  20, 0, 0, 0, 1, 1),
    (21, 'TAXTOTAL', 'Tax Total', 'TAXTOTAL', 21, 1, 1, 1, 1, 1),
    (22, 'NETTOTAL', 'Net Total', 'NETTOTAL', 22, 0, 0, 0, 1, 1),
    (23, 'DISCOUNT', 'Discount', 'DISCOUNT', 23, 0, 0, 0, 1, 1)
) v(Id, TaxCode, TaxName, CategoryCode, DisplayOrder, IsActive, AssessmentStatus, OldTaxStatus, IsProtected, CalculationModeId)
JOIN PTIS.TaxCategoryMaster c ON c.CategoryCode = v.CategoryCode
WHERE NOT EXISTS (
    SELECT 1 FROM PTIS.TaxMaster t WHERE t.Id = v.Id
);

SET IDENTITY_INSERT [PTIS].[TaxMaster] OFF;

GO

SET IDENTITY_INSERT [PTIS].[WingMaster] ON 
INSERT [PTIS].[WingMaster] ([Id], [WingNo], [SequenceNo], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES 
(1, N'A', 1, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL),
(2, N'B', 2, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(3, N'C', 3, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(4, N'D', 4, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(5, N'E', 5, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(6, N'F', 6, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(7, N'G', 7, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(8, N'H', 8, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(9, N'I', 9, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(10, N'J', 10, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(11, N'K', 11, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(12, N'L', 12, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(13, N'M', 13, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(14, N'N', 14, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(15, N'O', 15, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(16, N'P', 16, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(17, N'Q', 17, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(18, N'R', 18, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(19, N'S', 19, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(20, N'T', 20, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(21, N'U', 21, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(22, N'V', 22, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(23, N'W', 23, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL),
(24, N'X', 24, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL),
(25, N'Y', 25, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL), 
(26, N'Z', 26, 1, NULL, CAST(N'2026-03-25T12:44:07.727' AS DateTime), NULL, NULL)
SET IDENTITY_INSERT [PTIS].[WingMaster] OFF


---- policy tax details - seed data ----
-- No default seed data. PTIS.PolicyTaxDetails is the RV/CV pipeline's
-- own property-wise tax transaction table (PropertyId, PolicyCodeId,
-- PolicyYear, TaxId) -- populated by that pipeline against real
-- properties/taxes, not by synthetic demo rows here.


SET IDENTITY_INSERT [PTIS].[RoomTypeMaster] ON;

;WITH SeedData AS
(
    SELECT *
    FROM
    (
        VALUES
        (1,N'Bath',N'BATH'),
        (2,N'Bed Bal',N'BEDBAL'),
        (3,N'BED1',N'BED1'),
        (4,N'BED1 Bal ENC',N'BED1BE'),
        (5,N'BED2',N'BED2'),
        (6,N'BED2 Bal ENC',N'BED2BE'),
        (7,N'BED3',N'BED3'),
        (8,N'Hall',N'HALL'),
        (9,N'Hall Bal',N'HALBAL'),
        (10,N'Hall Bal ENC',N'HALENC'),
        (11,N'Individual',N'IND'),
        (12,N'Kit Bal',N'KITBAL'),
        (13,N'Kit Bal ENC',N'KITENC'),
        (14,N'Kit/Din',N'KITDIN'),
        (15,N'Office',N'OFF'),
        (16,N'OpenPlot',N'OPENPLT'),
        (17,N'Other',N'OTHER'),
        (18,N'Parking',N'PARK'),
        (19,N'Passage',N'PASS'),
        (20,N'PSG',N'PSG'),
        (21,N'Rooms',N'ROOMS'),
        (22,N'Shop',N'SHOP'),
        (23,N'Staire',N'STAIRE'),
        (24,N'W/C/Bath',N'WCBATH'),
        (25,N'WC',N'WC')
    ) AS V(Id,RoomTypeName,RoomTypeCode)
)

INSERT INTO [PTIS].[RoomTypeMaster]
(
    [Id],
    [RoomTypeName],
    [RoomTypeCode],
    [IsActive],
    [CreatedBy],
    [CreatedDate],
    [UpdatedBy],
    [UpdatedDate]
)
SELECT
    S.Id,
    S.RoomTypeName,
    S.RoomTypeCode,
    1,
    NULL,
    GETDATE(),
    NULL,
    NULL
FROM SeedData S
WHERE NOT EXISTS
(
    SELECT 1
    FROM [PTIS].[RoomTypeMaster] R
    WHERE R.Id = S.Id
)
AND NOT EXISTS
(
    SELECT 1
    FROM [PTIS].[RoomTypeMaster] R
    WHERE R.RoomTypeName = S.RoomTypeName
);

SET IDENTITY_INSERT [PTIS].[RoomTypeMaster] OFF;

GO

-- ==========================================
-- Rules Engine Configuration Seed Data
-- ==========================================

SET IDENTITY_INSERT [PTIS].[RuleScopeMaster] ON 
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeMaster] WHERE [RuleScope] = N'Property Level')
    INSERT [PTIS].[RuleScopeMaster] ([Id], [RuleScope], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (1, N'Property Level', 1, 1, CAST(N'2026-05-04T15:43:57.587' AS DateTime), 0, CAST(N'2026-05-04T15:44:33.573' AS DateTime))
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeMaster] WHERE [RuleScope] = N'DynamicTaxRegisterCondition')
    INSERT [PTIS].[RuleScopeMaster] ([Id], [RuleScope], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2, N'DynamicTaxRegisterCondition', 1, 1, CAST(N'2026-05-04T15:43:57.587' AS DateTime), 0, CAST(N'2026-05-04T15:44:33.573' AS DateTime))
GO
SET IDENTITY_INSERT [PTIS].[RuleScopeMaster] OFF
GO

SET IDENTITY_INSERT [PTIS].[RulesFieldMaster] ON 
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Floor')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (1, N'Floor', N'Int', 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL, N'FloorId')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Type')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (2, N'Type', N'String', 1, 1, CAST(N'2026-05-18T11:30:10.320' AS DateTime), 1, CAST(N'2026-05-27T17:35:26.497' AS DateTime), N'TypeOfUseGroupId')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Construction Type')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (3, N'Construction Type', N'String', 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL, N'ConstructionTypeId')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Zone')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (4, N'Zone', N'String', 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL, N'TaxZoneId')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Ward')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (5, N'Ward', N'String', 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL, N'WardId')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Year Range')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (6, N'Year Range', N'Int', 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL, N'AssessmentYear')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Area Sq.Mt')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (7, N'Area Sq.Mt', N'Double', 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Rented')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (8, N'Rented', N'Boolean', 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL, N'IsRenter')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Owner Type')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (9, N'Owner Type', N'String', 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL, N'OwnerTypeId')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Property Type')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (10, N'Property Type', N'String', 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL, N'PropertyTypeId')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Sub Floor')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (11, N'Sub Floor', N'String', 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL, N'SubFloorId')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Occupancy Certificate')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (13, N'Occupancy Certificate', N'Boolean', 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL, N'OccupancyCertificate')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Commencement Certificate')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (14, N'Commencement Certificate', N'Boolean', 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL, N'CommencementCertificate')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Carpet Area SqMeter')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (15, N'Carpet Area SqMeter', N'Double', 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL, N'CarpetAreaSqMeter')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Builtup Area SqMeter')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (16, N'Builtup Area SqMeter', N'Double', 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL, N'BuiltupAreaSqMeter')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Carpet Area SqFeet')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (17, N'Carpet Area SqFeet', N'Double', 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL, N'CarpetAreaSqFeet')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Builtup Area SqFeet')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (18, N'Builtup Area SqFeet', N'Double', 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL, N'BuiltupAreaSqFeet')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Type Of Use')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (19, N'Type Of Use', N'Int', 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL, N'TypeOfUseId')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Amenity')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (1011, N'Amenity', N'String', 1, 1, CAST(N'2026-06-09T12:42:27.143' AS DateTime), NULL, NULL, N'SocialAttributeId')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Category')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (1013, N'Category', N'String', 1, 1, CAST(N'2026-06-17T15:16:02.797' AS DateTime), NULL, NULL, N'CategoryId')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Total Floors')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (2013, N'Total Floors', N'Int', 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL, N'BuildingMaxFloorSequence')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Tax Liability')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (3013, N'Tax Liability', N'String', 1, 1, CAST(N'2026-07-06T12:31:02.063' AS DateTime), NULL, NULL, N'TaxLiability')
GO

IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Rateable Value')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (3014, N'Rateable Value', N'Int', 1, 1, CAST(N'2026-07-06T12:31:02.063' AS DateTime), NULL, NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Toilet Count')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (3015, N'Toilet Count', N'Int', 1, 1, CAST(N'2026-07-06T12:31:02.063' AS DateTime), NULL, NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RulesFieldMaster] WHERE [FieldName] = N'Road Width')
    INSERT [PTIS].[RulesFieldMaster] ([Id], [FieldName], [FieldType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [DatabaseColumnName]) VALUES (3016, N'Road Width', N'Int', 1, 1, CAST(N'2026-07-06T12:31:02.063' AS DateTime), NULL, NULL, NULL)
GO
SET IDENTITY_INSERT [PTIS].[RulesFieldMaster] OFF
GO

SET IDENTITY_INSERT [PTIS].[RuleCategoryMaster] ON 
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleCategoryMaster] WHERE [CategoryCode] = N'RV')
    INSERT [PTIS].[RuleCategoryMaster] ([Id], [CategoryCode], [CategoryName], [Description], [SortOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (1, N'RV', N'RV (Rateable Value)', N'Rules applicable to Rateable Value method', 1, 1, 1, CAST(N'2026-05-28T14:31:42.670' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleCategoryMaster] WHERE [CategoryCode] = N'CV')
    INSERT [PTIS].[RuleCategoryMaster] ([Id], [CategoryCode], [CategoryName], [Description], [SortOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2, N'CV', N'CV (Capital Value)', N'Rules applicable to Capital Value method', 2, 1, 1, CAST(N'2026-05-28T14:31:42.670' AS DateTime), NULL, NULL)
GO
SET IDENTITY_INSERT [PTIS].[RuleCategoryMaster] OFF
GO

SET IDENTITY_INSERT [PTIS].[RuleEffectTypeMaster] ON 
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleEffectTypeMaster] WHERE [EffectType] = N'Increase %')
    INSERT [PTIS].[RuleEffectTypeMaster] ([Id], [EffectType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (1, N'Increase %', 1, 1, CAST(N'2026-05-05T19:03:44.857' AS DateTime), 1, CAST(N'2026-05-05T19:04:14.420' AS DateTime))
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleEffectTypeMaster] WHERE [EffectType] = N'Decrease %')
    INSERT [PTIS].[RuleEffectTypeMaster] ([Id], [EffectType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2, N'Decrease %', 1, 1, CAST(N'2026-05-18T14:22:05.493' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleEffectTypeMaster] WHERE [EffectType] = N'Multiply')
    INSERT [PTIS].[RuleEffectTypeMaster] ([Id], [EffectType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) 
    VALUES (3, N'Multiply', 1, 1, CAST(N'2026-07-18T15:57:24.273' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleEffectTypeMaster] WHERE [EffectType] = N'RateLookup')
    INSERT [PTIS].[RuleEffectTypeMaster] ([Id], [EffectType], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) 
    VALUES (4, N'RateLookup', 1, 1, CAST(N'2026-07-22T12:02:34.953' AS DateTime), NULL, NULL)
GO
SET IDENTITY_INSERT [PTIS].[RuleEffectTypeMaster] OFF
GO

BEGIN TRY
    SET IDENTITY_INSERT [PTIS].[RuleOperatorMaster] ON;

    IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleOperatorMaster] WHERE [Operator] = N'=')
        INSERT [PTIS].[RuleOperatorMaster] ([Id], [Operator], [OperatorDescription], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (1, N'=', N'Equal To', 1, 1, CAST(N'2026-05-07T12:40:19.087' AS DateTime), 0, CAST(N'2026-05-07T12:40:54.183' AS DateTime));

    IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleOperatorMaster] WHERE [Operator] = N'!=')
        INSERT [PTIS].[RuleOperatorMaster] ([Id], [Operator], [OperatorDescription], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2, N'!=', N'Not Equal To', 1, 1, CAST(N'2026-05-18T14:32:23.880' AS DateTime), NULL, NULL);

    IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleOperatorMaster] WHERE [Operator] = N'>')
        INSERT [PTIS].[RuleOperatorMaster] ([Id], [Operator], [OperatorDescription], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (3, N'>', N'Greater Than', 1, 1, CAST(N'2026-05-18T14:32:23.880' AS DateTime), NULL, NULL);

    IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleOperatorMaster] WHERE [Operator] = N'<')
        INSERT [PTIS].[RuleOperatorMaster] ([Id], [Operator], [OperatorDescription], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (4, N'<', N'Less Than', 1, 1, CAST(N'2026-05-18T14:32:23.880' AS DateTime), NULL, NULL);

    IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleOperatorMaster] WHERE [Operator] = N'>=')
        INSERT [PTIS].[RuleOperatorMaster] ([Id], [Operator], [OperatorDescription], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (5, N'>=', N'Greater Than Or Equal To', 1, 1, CAST(N'2026-05-18T14:32:23.880' AS DateTime), NULL, NULL);

    IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleOperatorMaster] WHERE [Operator] = N'<=')
        INSERT [PTIS].[RuleOperatorMaster] ([Id], [Operator], [OperatorDescription], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (6, N'<=', N'Less Than Or Equal To', 1, 1, CAST(N'2026-05-18T14:32:23.880' AS DateTime), NULL, NULL);

    IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleOperatorMaster] WHERE [Operator] = N'In')
        INSERT [PTIS].[RuleOperatorMaster] ([Id], [Operator], [OperatorDescription], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (7, N'In', N'Value exists in list', 1, 1, CAST(N'2026-05-18T14:32:23.880' AS DateTime), NULL, NULL);

    IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleOperatorMaster] WHERE [Operator] = N'Not In')
        INSERT [PTIS].[RuleOperatorMaster] ([Id], [Operator], [OperatorDescription], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (8, N'Not In', N'Value does not exist in list', 1, 1, CAST(N'2026-05-18T14:32:23.880' AS DateTime), NULL, NULL);

    IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleOperatorMaster] WHERE [Operator] = N'Contains Any')
        INSERT [PTIS].[RuleOperatorMaster] ([Id], [Operator], [OperatorDescription], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (9, N'Contains Any', N'Contains any matching value', 1, 1, CAST(N'2026-05-18T14:32:23.880' AS DateTime), NULL, NULL);

    IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleOperatorMaster] WHERE [Operator] = N'Contains All')
        INSERT [PTIS].[RuleOperatorMaster] ([Id], [Operator], [OperatorDescription], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (10, N'Contains All', N'Contains all matching values', 1, 1, CAST(N'2026-05-18T14:32:23.880' AS DateTime), NULL, NULL);

    IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleOperatorMaster] WHERE [Operator] = N'Between')
        INSERT [PTIS].[RuleOperatorMaster] ([Id], [Operator], [OperatorDescription], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (11, N'Between', N'Value Between Range', 1, 1, CAST(N'2026-05-18T14:32:23.880' AS DateTime), NULL, NULL);

    SET IDENTITY_INSERT [PTIS].[RuleOperatorMaster] OFF;
END TRY
BEGIN CATCH
    SET IDENTITY_INSERT [PTIS].[RuleOperatorMaster] OFF;
    THROW;
END CATCH;
GO

BEGIN TRY
    SET IDENTITY_INSERT [PTIS].[PropertyRuleEvaluationMaster] ON;

    IF NOT EXISTS (SELECT 1 FROM [PTIS].[PropertyRuleEvaluationMaster] WHERE [Id] = 1)
        INSERT [PTIS].[PropertyRuleEvaluationMaster] ([Id], [ParameterCode], [ParameterName], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (1, N'Rate', N'Rate', 1, 0, CAST(N'2026-05-26T13:13:56.370' AS DateTime), NULL, NULL);

    IF NOT EXISTS (SELECT 1 FROM [PTIS].[PropertyRuleEvaluationMaster] WHERE [Id] = 5)
        INSERT [PTIS].[PropertyRuleEvaluationMaster] ([Id], [ParameterCode], [ParameterName], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (5, N'Rent', N'Rent', 1, 1, CAST(N'2026-07-20T18:01:15.640' AS DateTime), NULL, NULL);

    IF NOT EXISTS (SELECT 1 FROM [PTIS].[PropertyRuleEvaluationMaster] WHERE [Id] = 6)
        INSERT [PTIS].[PropertyRuleEvaluationMaster] ([Id], [ParameterCode], [ParameterName], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (6, N'Maintenance', N'Maintenance', 1, 0, CAST(N'2026-08-04T19:04:32.650' AS DateTime), NULL, NULL);

    SET IDENTITY_INSERT [PTIS].[PropertyRuleEvaluationMaster] OFF;
END TRY
BEGIN CATCH
    SET IDENTITY_INSERT [PTIS].[PropertyRuleEvaluationMaster] OFF;
    THROW;
END CATCH;
GO

SET IDENTITY_INSERT [PTIS].[EffectTypeConfiguration] ON 
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[EffectTypeConfiguration] WHERE [EffectTypeId] = 1)
    INSERT [PTIS].[EffectTypeConfiguration] ([Id], [EffectTypeId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ExpressionTemplate], [StaticApiEndpoint], [StaticApiInputType], [StaticApiMethod], [StaticApiParamter], [StaticApiResponseMapping]) VALUES (1, 1, N'String', N'TextBox', 0, N'', N'', N'', 0, N'', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-05-27T16:36:11.117' AS DateTime), NULL, NULL, NULL, N'PropertyRuleEvaluationMaster', N'dropdown', N'GET', N'{"PageSize":"-1"}', N'{"responsePath":"data","valuePath":"id","labelPath":"parameterName","displayTemplate":"{parameterCode} - {parameterName}","additionalFields":{"parameterCode":"parameterCode"}}')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[EffectTypeConfiguration] WHERE [EffectTypeId] = 2)
    INSERT [PTIS].[EffectTypeConfiguration] ([Id], [EffectTypeId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ExpressionTemplate], [StaticApiEndpoint], [StaticApiInputType], [StaticApiMethod], [StaticApiParamter], [StaticApiResponseMapping]) VALUES (2, 2, N'String', N'TextBox', 0, N'', N'', N'', 0, N'', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-05-27T16:36:11.117' AS DateTime), NULL, NULL, NULL, N'PropertyRuleEvaluationMaster', N'dropdown', N'GET', N'{"PageSize":"-1"}', N'{"responsePath":"data","valuePath":"id","labelPath":"parameterName","displayTemplate":"{parameterCode} - {parameterName}","additionalFields":{"parameterCode":"parameterCode"}}')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[EffectTypeConfiguration] WHERE [EffectTypeId] = 3)
    INSERT [PTIS].[EffectTypeConfiguration] ([Id], [EffectTypeId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ExpressionTemplate], [StaticApiEndpoint], [StaticApiInputType], [StaticApiMethod], [StaticApiParamter], [StaticApiResponseMapping]) 
    VALUES (3, 3, N'string', N'TextBox', 0, N'', N'', N'', 0, N'', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-05-27T16:36:11.117' AS DateTime), NULL, NULL, NULL, N'PropertyRuleEvaluationMaster', N'dropdown', N'GET', N'{"PageSize":"-1"}', N'{"responsePath":"data","valuePath":"id","labelPath":"parameterName","displayTemplate":"{parameterCode} - {parameterName}","additionalFields":{"parameterCode":"parameterCode"}}')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[EffectTypeConfiguration] WHERE [EffectTypeId] = 4)
    INSERT [PTIS].[EffectTypeConfiguration] ([Id], [EffectTypeId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ExpressionTemplate], [StaticApiEndpoint], [StaticApiInputType], [StaticApiMethod], [StaticApiParamter], [StaticApiResponseMapping])
    VALUES (4, 4, N'string', N'TextBox', 1, N'', N'', N'', 0, N'', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 101, CAST(N'2026-07-04T13:37:13.747' AS DateTime), NULL, CAST(N'2026-07-04T13:39:30.047' AS DateTime), N'', N'TypeOfUseGroup', N'dropdown', N'GET', N'{"PageSize":"-1"}', N'{"responsePath":"data","valuePath":"id","labelPath":"parameterName","displayTemplate":"{typeOfUseGroupCode} - {groupName}","additionalFields":{"parameterCode":"typeOfUseGroupCode"}}')
GO
SET IDENTITY_INSERT [PTIS].[EffectTypeConfiguration] OFF
GO

SET IDENTITY_INSERT [PTIS].[FieldConfiguration] ON 
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 1)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (3, 1, N'Int', N'Dropdown', 1, N'Floor', N'Get', N'{"PageSize":"-1"}', 0, N'', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-05-21T11:51:26.163' AS DateTime), NULL, NULL, N'{"responsePath":"items","valuePath":"id","labelPath":"description","displayTemplate":"{floorCode} - {description}","additionalFields":{"floorCode":"floorCode","sequenceNo":"sequenceNo"}}')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 2)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (4, 2, N'String', N'Dropdown', 1, N'TypeOfUseGroup', N'GET', N'{"PageSize":"-1"}', 0, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, CAST(N'2026-05-21T11:51:26.163' AS DateTime), 1, CAST(N'2026-05-27T17:35:26.500' AS DateTime), N'{"responsePath":"items","valuePath":"id","labelPath":"groupName","displayTemplate":"{typeOfUseGroupCode} - {groupName}","additionalFields":{"constructionCode":"constructionCode"}}')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 3)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (5, 3, N'String', N'Dropdown', 1, N'ConstructionType', N'Get', N'{"PageSize":"-1"}', 0, N'', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-05-27T16:14:23.820' AS DateTime), NULL, NULL, N'{"responsePath":"items","valuePath":"id","labelPath":"description","displayTemplate":"{constructionCode} - {description}","additionalFields":{"constructionCode":"constructionCode"}}')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 4)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (6, 4, N'String', N'Dropdown', 1, N'TaxZone', N'Get', N'{"PageSize":"-1"}', 0, N'', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-05-27T16:14:23.820' AS DateTime), NULL, NULL, N'{"responsePath":"items","valuePath":"id","labelPath":"remark","displayTemplate":"{remark}"}')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 5)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (7, 5, N'String', N'Dropdown', 1, N'Ward', N'Get', N'{"PageSize":"-1"}', 0, N'', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-05-27T16:14:23.820' AS DateTime), NULL, NULL, N'{"responsePath":"items","valuePath":"id","labelPath":"wardNo","displayTemplate":"{description}"}')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 6)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (8, 6, N'Int', N'Dropdown', 1, N'AssessmentYearRange', N'Get', N'{"PageSize":"-1"}', 0, N'', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-05-27T16:14:23.820' AS DateTime), NULL, NULL, N'{"responsePath":"items","valuePath":"id","labelPath":"fromYear","displayTemplate":"{fromYear} - {toYear}"}')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 7)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (9, 7, N'Double', N'TextBox', 0, N'', N'', N'{"PageSize":"-1"}', 0, N'', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-05-27T16:14:23.820' AS DateTime), NULL, NULL, N'')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 8)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (10, 8, N'Boolean', N'Dropdown', 0, N'', N'', N'{"PageSize":"-1"}', 1, N'[
  {
    "label": "True",
    "value": true
  },
  {
    "label": "False",
    "value": false
  }
]', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-05-27T16:14:23.820' AS DateTime), NULL, NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 9)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (11, 9, N'String', N'Dropdown', 1, N'OwnerType', N'Get', N'{"PageSize":"-1"}', 0, N'', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-05-27T16:14:23.820' AS DateTime), NULL, NULL, N'{"responsePath":"items","valuePath":"id","labelPath":"ownerType","displayTemplate":"{ownerType}"}')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 10)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (12, 10, N'String', N'Dropdown', 1, N'PropertyTypeMaster', N'Get', N'{"PageSize":"-1"}', 0, N'', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-05-27T16:14:23.820' AS DateTime), NULL, NULL, N'{"responsePath":"items","valuePath":"id","labelPath":"propertyDescription","displayTemplate":"{type} - {propertyDescription}","additionalFields":{"type":"type"}}')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 11)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (13, 11, N'String', N'Dropdown', 1, N'SubFloor', N'Get', N'{"PageSize":"-1"}', 0, N'', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-05-21T11:51:26.163' AS DateTime), NULL, NULL, N'{"responsePath":"items","valuePath":"id","labelPath":"description","displayTemplate":"{subFloorCode} - {description}","additionalFields":{"subFloorCode":"subFloorCode","sequenceNo":"sequenceNo"}}')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 13)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (15, 13, N'Boolean', N'Dropdown', 0, N'', N'', N'{"PageSize":"-1"}', 1, N'[
  {
    "label": "True",
    "value": true
  },
  {
    "label": "False",
    "value": false
  }
]', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-05-27T16:14:23.820' AS DateTime), NULL, NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 14)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (16, 14, N'Boolean', N'Dropdown', 0, N'', N'', N'{"PageSize":"-1"}', 1, N'[
  {
    "label": "True",
    "value": true
  },
  {
    "label": "False",
    "value": false
  }
]', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-05-27T16:14:23.820' AS DateTime), NULL, NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 15)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (17, 15, N'Double', N'TextBox', 0, N'', N'', N'', 0, N'', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-05-27T16:14:23.820' AS DateTime), NULL, NULL, N'')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 16)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (18, 16, N'Double', N'TextBox', 0, N'', N'', N'', 0, N'', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-05-27T16:14:23.820' AS DateTime), NULL, NULL, N'')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 17)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (19, 17, N'Double', N'TextBox', 0, N'', N'', N'', 0, N'', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-05-27T16:14:23.820' AS DateTime), NULL, NULL, N'')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 18)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (20, 18, N'Double', N'TextBox', 0, N'', N'', N'', 0, N'', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-05-27T16:14:23.820' AS DateTime), NULL, NULL, N'')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 19)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (22, 19, N'Int', N'Dropdown', 1, N'TypeOfUse', N'Get', N'{"PageSize":"-1"}', 0, N'', 1, N'', N'', CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-05-21T11:51:26.163' AS DateTime), NULL, NULL, N'{"responsePath":"items","valuePath":"id","labelPath":"description","displayTemplate":"{typeOfUseCode} - {description}","additionalFields":{"typeOfUseCode":"typeOfUseCode","sequenceNo":"sequenceNo"}}')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 1011)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (1013, 1011, N'String', N'Dropdown', 1, N'SocialAttribute', N'Get', N'{"PageSize":"-1"}', 0, N'', 1, NULL, NULL, CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-06-09T12:50:33.540' AS DateTime), NULL, NULL, N'{"responsePath":"items","valuePath":"id","labelPath":"socialAttributeName","displayTemplate":"{socialAttributeName}"}')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 1013)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (1015, 1013, N'String', N'Dropdown', 1, N'PropertyCategory', N'Get', N'{"PageSize":"-1"}', 0, N'', 1, NULL, NULL, CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), 0, 0, 1, 1, CAST(N'2026-06-09T12:50:33.540' AS DateTime), NULL, NULL, N'{"responsePath":"items","valuePath":"id","labelPath":"propertyCategoryName","displayTemplate":"{propertyCategoryName}"}')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 2013)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (2015, 2013, N'Int', N'Dropdown', 1, N'Floor', N'Get', N'{"PageSize":"-1"}', 0, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, CAST(N'2026-05-21T11:51:26.163' AS DateTime), NULL, NULL, N'{"responsePath":"items","valuePath":"sequenceNo","labelPath":"description","displayTemplate":"{floorCode} - {description}","additionalFields":{"floorCode":"floorCode","sequenceNo":"sequenceNo"}}')
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[FieldConfiguration] WHERE [RulesFieldId] = 3013)
    INSERT [PTIS].[FieldConfiguration] ([Id], [RulesFieldId], [DataType], [InputType], [HasApiSource], [ApiEndpoint], [ApiMethod], [ApiParameters], [HasStaticValues], [StaticValuesJson], [IsRequired], [DefaultValue], [ValidationRegex], [MinValue], [MaxValue], [MinLength], [MaxLength], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ApiResponseMapping]) VALUES (3015, 3013, N'String', N'Dropdown', 0, N'', N'', N'', 1, N'[{"label": "Self","value": "Self"},{"label": "Renter","value": "Renter"}]', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, CAST(N'2026-07-06T12:43:17.200' AS DateTime), NULL, NULL, NULL)
GO
SET IDENTITY_INSERT [PTIS].[FieldConfiguration] OFF
GO

SET IDENTITY_INSERT [PTIS].[RuleScopeFieldMapping] ON 
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 1)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (1, 1, 1, 1, 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 2)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2, 1, 2, 2, 1, 1, CAST(N'2026-05-18T11:30:10.320' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 3)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (3, 1, 3, 3, 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 4)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (4, 1, 4, 4, 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 5)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (5, 1, 5, 5, 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 6)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (6, 1, 6, 6, 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 7)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (7, 1, 7, 7, 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 8)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (8, 1, 8, 8, 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 9)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (9, 1, 9, 9, 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 10)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (10, 1, 10, 10, 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 11)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (11, 1, 11, 11, 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 13)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (12, 1, 13, 13, 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 14)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (13, 1, 14, 14, 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 15)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (14, 1, 15, 15, 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 16)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (15, 1, 16, 16, 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 17)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (16, 1, 17, 17, 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 18)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (17, 1, 18, 18, 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 19)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (18, 1, 19, 19, 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 1011)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (19, 1, 1011, 1011, 1, 1, CAST(N'2026-06-09T12:42:27.143' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 1013)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (20, 1, 1013, 1013, 1, 1, CAST(N'2026-06-17T15:24:15.270' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 2013)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (21, 1, 2013, 2013, 1, 1, CAST(N'2026-06-19T18:41:24.770' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 3013)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (22, 1, 3013, 3013, 1, 1, CAST(N'2026-07-06T12:33:19.597' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 3014)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (23, 1, 3014, 3014, 1, 1, CAST(N'2026-07-06T12:33:19.597' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 3015)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (24, 1, 3015, 3015, 1, 1, CAST(N'2026-07-06T12:33:19.597' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 1 AND [RulesFieldId] = 3016)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (25, 1, 3016, 3016, 1, 1, CAST(N'2026-07-06T12:33:19.597' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 1)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (26, 2, 1, 1, 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL)
GO                                                                                                                                                                             
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 2)                                                                    
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (27, 2, 2, 2, 1, 1, CAST(N'2026-05-18T11:30:10.320' AS DateTime), NULL, NULL)
GO                                                                                                                                                                             
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 3)                                                                    
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (28, 2, 3, 3, 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL)
GO                                                                                                                                                                             
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 4)                                                                    
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (29, 2, 4, 4, 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL)
GO                                                                                                                                                                             
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 5)                                                                    
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (30, 2, 5, 5, 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL)
GO                                                                                                                                                                             
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 6)                                                                    
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (31, 2, 6, 6, 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL)
GO                                                                                                                                                                             
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 7)                                                                    
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (32, 2, 7, 7, 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL)
GO                                                                                                                                                                             
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 8)                                                                    
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (33, 2, 8, 8, 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL)
GO                                                                                                                                                                             
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 9)                                                                    
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (34, 2, 9, 9, 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL)
GO
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 10)
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (35, 2, 10, 10, 1, 1, CAST(N'2026-05-27T15:13:01.553' AS DateTime), NULL, NULL)
GO                                                                                                                                                                              
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 11)                                                                    
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (36, 2, 11, 11, 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL)
GO                                                                                                                                                                              
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 13)                                                                    
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (37, 2, 13, 13, 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL)
GO                                                                                                                                                                              
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 14)                                                                    
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (38, 2, 14, 14, 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL)
GO                                                                                                                                                                              
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 15)                                                                    
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (39, 2, 15, 15, 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL)
GO                                                                                                                                                                              
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 16)                                                                    
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (40, 2, 16, 16, 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL)
GO                                                                                                                                                                              
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 17)                                                                    
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (41, 2, 17, 17, 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL)
GO                                                                                                                                                                              
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 18)                                                                    
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (42, 2, 18, 18, 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL)
GO                                                                                                                                                                              
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 19)                                                                    
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (43, 2, 19, 19, 1, 1, CAST(N'2026-05-15T11:19:01.650' AS DateTime), NULL, NULL)
GO                                                                                                                                                                              
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 1011)                                                                  
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (44, 2, 1011, 1011, 1, 1, CAST(N'2026-06-09T12:42:27.143' AS DateTime), NULL, NULL)
GO                                                                                                                                                                              
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 1013)                                                                  
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (45, 2, 1013, 1013, 1, 1, CAST(N'2026-06-17T15:24:15.270' AS DateTime), NULL, NULL)
GO                                                                                                                                                                              
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 2013)                                                                  
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (46, 2, 2013, 2013, 1, 1, CAST(N'2026-06-19T18:41:24.770' AS DateTime), NULL, NULL)
GO                                                                                                                                                                              
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 3013)                                                                  
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (47, 2, 3013, 3013, 1, 1, CAST(N'2026-07-06T12:33:19.597' AS DateTime), NULL, NULL)
GO                                                                                                                                                                              
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 3014)                                                                  
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (48, 2, 3014, 3014, 1, 1, CAST(N'2026-07-06T12:33:19.597' AS DateTime), NULL, NULL)
GO                                                                                                                                                                              
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 3015)                                                                  
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (49, 2, 3015, 3015, 1, 1, CAST(N'2026-07-06T12:33:19.597' AS DateTime), NULL, NULL)
GO                                                                                                                                                                              
IF NOT EXISTS (SELECT 1 FROM [PTIS].[RuleScopeFieldMapping] WHERE [RuleScopeId] = 2 AND [RulesFieldId] = 3016)                                                                  
    INSERT [PTIS].[RuleScopeFieldMapping] ([Id], [RuleScopeId], [RulesFieldId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (50, 2, 3016, 3016, 1, 1, CAST(N'2026-07-06T12:33:19.597' AS DateTime), NULL, NULL)
GO
SET IDENTITY_INSERT [PTIS].[RuleScopeFieldMapping] OFF
GO


/* ============================================================================
   1. Seed PTIS.PolicyCodeMaster
   DBA-provided final policy code list and NextPolicyCodeId workflow
   chains (PARTIAL_OC -> OC, PARTIAL_CC -> CC, PARTIAL_ELECTRIC_BILL ->
   ELECTRIC_BILL, SECTION_129 staged chain). Runs once against a fresh
   table, so it is not wrapped in a WHERE NOT EXISTS -- guarded by
   IsSeeded check below instead.
   IsRetroDemand = 1 for OC/PARTIAL_OC/CC/PARTIAL_CC/ELECTRIC_BILL/
   PARTIAL_ELECTRIC_BILL -- the Retrospective Tax engine's own demand
   families. OLD_ARREARS (migrated ULB pending tax) is explicitly NOT
   retro demand -- see PTIS.TransMast's PolicyCodeId classification.
============================================================================ */

IF NOT EXISTS (SELECT 1 FROM [PTIS].[PolicyCodeMaster])
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        SET IDENTITY_INSERT [PTIS].[PolicyCodeMaster] ON;

        INSERT INTO [PTIS].[PolicyCodeMaster]
        (
            [Id],
            [PolicyCode],
            [PolicyName],
            [Description],
            [PolicyType],
            [NextPolicyCodeId],
            [IsFinalStage],
            [IsExclusive],
            [RequiresStageTracking],
            [DisplayOrder],
            [IsProtected],
            [IsActive],
            [CreatedBy],
            [IsRetroDemand]
        )
        VALUES
        (1,  'NETTAX',                 N'Net Tax',                        N'Normal final calculated property tax',                                                'NORMAL',      NULL, 1, 0, 0,  1, 1, 1, 1, 0),
        (2,  'AS_PER_OLD',             N'As Per Old',                     N'Old ULB tax is considered as the final applicable tax',                               'NORMAL',      NULL, 1, 1, 0,  2, 1, 1, 1, 0),
        (3,  'MIN_RV',                 N'Minimum RV',                     N'Minimum rateable value policy is applied',                                            'NORMAL',      NULL, 1, 1, 0,  3, 1, 1, 1, 0),
        (4,  'RETENTION',              N'Retention',                      N'Previous tax or rateable value is retained',                                          'NORMAL',      NULL, 1, 1, 0,  4, 1, 1, 1, 0),
        (5,  'PARTIAL_OC',             N'Partial Occupancy Certificate',  N'Prorated OC tax for the remaining days of the current financial year',                'DATE_BASED',  6,    0, 1, 1,  5, 1, 1, 1, 1),
        (6,  'OC',                     N'Occupancy Certificate',          N'Full-year tax based on the occupancy certificate',                                    'DATE_BASED',  NULL, 1, 1, 0,  6, 1, 1, 1, 1),
        (7,  'PARTIAL_CC',             N'Partial Completion Certificate', N'Prorated CC tax for the remaining days of the current financial year',                'DATE_BASED',  8,    0, 1, 1,  7, 1, 1, 1, 1),
        (8,  'CC',                     N'Completion Certificate',         N'Full-year tax based on the completion certificate',                                   'DATE_BASED',  NULL, 1, 1, 0,  8, 1, 1, 1, 1),
        (9,  'PARTIAL_ELECTRIC_BILL',  N'Partial Electricity Bill',       N'Prorated electricity-bill tax for the remaining days of the current financial year',  'DATE_BASED',  10,   0, 1, 1,  9, 1, 1, 1, 1),
        (10, 'ELECTRIC_BILL',          N'Electricity Bill',               N'Full-year tax based on the electricity bill date',                                    'DATE_BASED',  NULL, 1, 1, 0, 10, 1, 1, 1, 1),
        (11, 'SECTION_129_OLD_1',      N'Section 129 - Old Tax Year 1',   N'First financial year tax is equal to old ULB tax',                                    'STAGE_BASED', 12,   0, 1, 1, 11, 1, 1, 1, 0),
        (12, 'SECTION_129_OLD_2',      N'Section 129 - Old Tax Year 2',   N'Second financial year tax is equal to old ULB tax',                                   'STAGE_BASED', 13,   0, 1, 1, 12, 1, 1, 1, 0),
        (13, 'SECTION_129_20',         N'Section 129 - 20 Percent',       N'Section 129 twenty-percent stage',                                                     'STAGE_BASED', 14,   0, 1, 1, 13, 1, 1, 1, 0),
        (14, 'SECTION_129_40',         N'Section 129 - 40 Percent',       N'Section 129 forty-percent stage',                                                      'STAGE_BASED', 15,   0, 1, 1, 14, 1, 1, 1, 0),
        (15, 'SECTION_129_60',         N'Section 129 - 60 Percent',       N'Section 129 sixty-percent stage',                                                      'STAGE_BASED', 16,   0, 1, 1, 15, 1, 1, 1, 0),
        (16, 'SECTION_129_80',         N'Section 129 - 80 Percent',       N'Section 129 eighty-percent stage',                                                     'STAGE_BASED', 17,   0, 1, 1, 16, 1, 1, 1, 0),
        (17, 'SECTION_129_100',        N'Section 129 - 100 Percent',      N'Final Section 129 stage with full new assessment tax',                                'STAGE_BASED', NULL, 1, 1, 1, 17, 1, 1, 1, 0),
        (18, 'HEARING',                N'Hearing',                        N'Final tax decided during hearing',                                                     'DECISION',    NULL, 1, 1, 0, 18, 1, 1, 1, 0),
        (19, 'APPEAL_COMMITTEE',       N'Appeal Committee',               N'Final tax decided by the appeal committee',                                            'DECISION',    NULL, 1, 1, 0, 19, 1, 1, 1, 0),
        (20, 'REMISSION',              N'Remission',                      N'Final tax decided after remission',                                                    'DECISION',    NULL, 1, 1, 0, 20, 1, 1, 1, 0),
        (21, 'OLD_ARREARS',            N'Old Arrears',                    N'Pending tax amount received from ULB during migration',                               'NORMAL',      NULL, 1, 1, 0, 21, 1, 1, 1, 0),
        (22, 'PARTIAL_DIRECT_RETRO',   N'Partial Direct Retrospective',   N'Prorated retrospective tax of a rule with no start certificate, for the onset year',   'DATE_BASED',  23,   0, 1, 1, 22, 1, 1, 1, 1),
        (23, 'DIRECT_RETRO',           N'Direct Retrospective',           N'Full-year retrospective tax of a rule with no start certificate (no-certificate look-back)', 'DATE_BASED',  NULL, 1, 1, 0, 23, 1, 1, 1, 1);

        SET IDENTITY_INSERT [PTIS].[PolicyCodeMaster] OFF;

        COMMIT TRANSACTION;

        PRINT 'PTIS.PolicyCodeMaster seeded successfully.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH;
END
GO

------------------------------------------------------------
-- Indexes to support the NextPolicyCodeId chain and common lookups
------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PolicyCodeMaster_NextPolicyCodeId')
    CREATE INDEX [IX_PolicyCodeMaster_NextPolicyCodeId]
    ON [PTIS].[PolicyCodeMaster]
    (
        [NextPolicyCodeId]
    );
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PolicyCodeMaster_PolicyType_IsActive')
    CREATE INDEX [IX_PolicyCodeMaster_PolicyType_IsActive]
    ON [PTIS].[PolicyCodeMaster]
    (
        [PolicyType],
        [IsActive]
    )
    INCLUDE
    (
        [PolicyCode],
        [PolicyName],
        [IsFinalStage],
        [IsExclusive],
        [RequiresStageTracking]
    );
GO
-- PTIS.CertificateTaxGuideline retired (replaced by PTIS.RetrospectiveRuleMaster and the
-- Retrospective Rule Engine) -- seed data removed.

/* ============================================================================
   3. Seed PTIS.PropertyCertificateTypeMaster
============================================================================ */

SET IDENTITY_INSERT [PTIS].[PropertyCertificateTypeMaster] ON;

INSERT INTO PTIS.PropertyCertificateTypeMaster
(
    Id,
    CertificateTypeCode,
    CertificateTypeName,
    Description,
    DisplayOrder,
    IsTaxable,
    IsProtected,
    IsRequired,
    IsActive
)
SELECT
    v.Id,
    v.CertificateTypeCode,
    v.CertificateTypeName,
    v.Description,
    v.DisplayOrder,
    v.IsTaxable,
    v.IsProtected,
    v.IsRequired,
    1
FROM (VALUES
    (1, 'CC',                      N'Completion Certificate',   N'Completion Certificate used for CC based occupation tax calculation.',                      1,  1, 1, 1),
    (2, 'OC',                      N'Occupancy Certificate',    N'Occupancy Certificate used for OC based occupation tax calculation.',                       2,  1, 1, 1),
    (3, 'EleBillDt',               N'Electric Bill Date',       N'Electric Bill Date used as fallback certificate date for occupation tax calculation.',       3,  1, 1, 0)
    -- (4, 'POSSESSION_CERTIFICATE',  N'Possession Certificate',   N'Possession Certificate for document record purpose. Tax calculation disabled by default.',   4,  0, 0, 0),
    -- (5, 'INDEX_2',                 N'Index 2',                  N'Index 2 document for property record purpose. Tax calculation disabled by default.',         5,  0, 0, 0),
    -- (6, 'AGREEMENT',               N'Agreement',                N'Agreement document for property record purpose. Tax calculation disabled by default.',        6,  0, 0, 0),
    -- (7, 'SALE_DEED',               N'Sale Deed',                N'Sale Deed document for property record purpose. Tax calculation disabled by default.',        7,  0, 0, 0),
    -- (8, 'TAX_RECEIPT',             N'Tax Receipt',              N'Tax Receipt document for property record purpose. Tax calculation disabled by default.',      8,  0, 0, 0),
    -- (9, 'OTHER',                   N'Other',                    N'Other certificate or supporting document.',                                                 99, 0, 0, 0)
) v
(
    Id,
    CertificateTypeCode,
    CertificateTypeName,
    Description,
    DisplayOrder,
    IsTaxable,
    IsProtected,
    IsRequired
)
WHERE NOT EXISTS
(
    SELECT 1
    FROM PTIS.PropertyCertificateTypeMaster c
    WHERE c.CertificateTypeCode = v.CertificateTypeCode
);

SET IDENTITY_INSERT [PTIS].[PropertyCertificateTypeMaster] OFF;
GO
/* ============================================================================
   4. Seed PTIS.PropertyCertificates
   No default seed data required.

   Reason:
   This is a transaction table.
   Records must be inserted from Building Permission / Certificate Upload API
   against real PropertyId, PropertyDetailsId and DocumentBindingId.
============================================================================ */

/* ============================================================================
   1. Seed PTIS.RuleEngineMaster
        Thane Rules
============================================================================ */

SET IDENTITY_INSERT [PTIS].[RuleEngineMaster] ON
GO

    INSERT [PTIS].[RuleEngineMaster] ([Id], [RuleCode], [RuleName], [Description], [RuleCategory], [RuleJson], [Priority], [IsEnabled], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ConditionsJson], [EffectJson], [TargetFiltersJson], [StopProcessing], [RuleScopeId], [MarkedForDeletion], [MarkedForDeletionDate],[PropertyRuleEvaluationMasterId])
    VALUES (1, N'RULE-20260717-0001', N'Increase Rate', N'If building have Club House or Swimming  Pool then rate increase by 20%', N'RV', N'{"RuleName":"Increase Rate","isActive":true,"RuleCategory":"RV","rules":[{"RuleCode":"5d38d1bf-86a0-4c06-a15f-6d5179cf225c","errorMessage":"If building have Club House or Swimming  Pool then rate increase by 20%.","enabled":true,"ruleExpressionType":"LambdaExpression","expression":"input.CategoryId == (1) && (input.TypeOfUseId == 86 || input.TypeOfUseId == 104 || input.TypeOfUseId == 85 || input.TypeOfUseId == 14033)","Actions":{"OnSuccess":{"Name":"MultiEffect","Context":{"effects":[{"Expression":"input.Rate * (1 + 20 / 100)","effectType":"Increase %","value":"20","ParameterCode":"input.Rate"}]}}},"stopProcessing":true},{"RuleCode":"d9410f8e-4637-42b9-86c6-ba5e3f5df198","errorMessage":"If building having lift and floor above 10th then increase rate by 10%","enabled":true,"ruleExpressionType":"LambdaExpression","expression":"(input.CategoryId == 1 || input.CategoryId == 2) && input.SocialAttributeId.Contains(28) && input.BuildingMaxFloorSequence > 21","Actions":{"OnSuccess":{"Name":"MultiEffect","Context":{"effects":[{"Expression":"input.Rate * (1 + 10 / 100)","effectType":"Increase %","value":"10","ParameterCode":"input.Rate"}]}}},"stopProcessing":false},{"RuleCode":"985b6c26-b37f-41d0-a1b0-2367b919c033","errorMessage":"If building having lift and floor upto 10th then increase rate by 5%","enabled":true,"ruleExpressionType":"LambdaExpression","expression":"input.BuildingMaxFloorSequence <= 21 && input.SocialAttributeId.Contains(28)","Actions":{"OnSuccess":{"Name":"MultiEffect","Context":{"effects":[{"Expression":"input.Rate * (1 + 5 / 100)","effectType":"Increase %","value":"5","ParameterCode":"input.Rate"}]}}},"stopProcessing":false}]}', 1, 1, 1, 1, CAST(N'2026-07-17T18:11:43.717' AS DateTime), 1, CAST(N'2026-07-20T16:27:46.540' AS DateTime), N'[{"id":"5d38d1bf-86a0-4c06-a15f-6d5179cf225c","description":"If building have Club House or Swimming  Pool then rate increase by 20%.","conditions":{"id":"1fed7e7b-43dd-42df-922d-f26a1506b048","logicalOperator":"AND","conditions":[{"id":"bb643f85-4f6a-4cd4-8c48-140a43037801","fieldId":"CategoryId","operator":"=","value":["1"],"valueLabel":["Apartment"]},{"id":"4113fc95-34f3-4cdf-bc13-29ecb9a8f108","fieldId":"TypeOfUseId","operator":"In","value":["86","104","85","14033"],"valueLabel":["ASWC - सोसायटी स्विमिंग पूल C","ASW - सोसायटी स्विमिंग पूल","ACHC - क्लब हाऊस C","ACH - क्लब हाऊस"]}],"groups":[]},"effect":[{"effectType":"Increase %","value":20,"isPercentage":true,"overrideRate":1}],"effects":[{"effectType":"Increase %","value":20,"isPercentage":true,"overrideRate":1}],"stopProcessing":true,"ruleScopeName":"Property Level"},{"id":"d9410f8e-4637-42b9-86c6-ba5e3f5df198","description":"If building having lift and floor above 10th then increase rate by 10%","conditions":{"id":"9383f25a-0ceb-44a1-8c3a-de6027bafc0d","logicalOperator":"AND","conditions":[{"id":"4a4fc553-563a-4f83-b5e5-5616a0362e62","fieldId":"CategoryId","operator":"In","value":["1","2"],"valueLabel":["Apartment","Individual"]},{"id":"dd06caab-04f7-4f8c-9cc7-f560ba2ad96f","fieldId":"SocialAttributeId","operator":"=","value":"28","valueLabel":"Lift Available"},{"id":"161d5be5-473f-4284-90dc-c074023a59e8","fieldId":"BuildingMaxFloorSequence","operator":">","value":"21","valueLabel":"10 - दहावा मजला"}],"groups":[]},"effect":[{"effectType":"Increase %","value":10,"isPercentage":true,"overrideRate":1}],"effects":[{"effectType":"Increase %","value":10,"isPercentage":true,"overrideRate":1}],"stopProcessing":false,"ruleScopeName":"Property Level"},{"id":"985b6c26-b37f-41d0-a1b0-2367b919c033","description":"If building having lift and floor upto 10th then increase rate by 5%","conditions":{"id":"30ef5bc0-67f9-41a1-994a-b926fd12b106","logicalOperator":"AND","conditions":[{"id":"8e4ff554-cd14-4185-8d4a-d5265b9bff62","fieldId":"BuildingMaxFloorSequence","operator":"<=","value":"21","valueLabel":"10 - दहावा मजला"},{"id":"d7e94c88-51e4-48ba-94a3-9394c6e923c1","fieldId":"SocialAttributeId","operator":"=","value":"28","valueLabel":"Lift Available"}],"groups":[]},"effect":[{"effectType":"Increase %","value":5,"isPercentage":true,"overrideRate":1}],"effects":[{"effectType":"Increase %","value":5,"isPercentage":true,"overrideRate":1}],"stopProcessing":false,"ruleScopeName":"Property Level"}]', N'[{"effectType":"Increase %","value":20,"isPercentage":true,"overrideRate":1}]', N'{}', 0, 1, 0, NULL,1)
GO

    INSERT [PTIS].[RuleEngineMaster] ([Id], [RuleCode], [RuleName], [Description], [RuleCategory], [RuleJson], [Priority], [IsEnabled], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ConditionsJson], [EffectJson], [TargetFiltersJson], [StopProcessing], [RuleScopeId], [MarkedForDeletion], [MarkedForDeletionDate],[PropertyRuleEvaluationMasterId])
    VALUES (2, N'RULE-20260718-0001', N'Basement Property Rule', N'If Commercial use in Basement floor then decrees rate by 20%', N'RV', N'{"RuleName":"Basement Property Rule","isActive":true,"RuleCategory":"RV","rules":[{"RuleCode":"b12107d8-f611-4362-a65f-adc25f0b21a6","errorMessage":"If lower ground  floor use as Commercial  then decrees rate by 20%","enabled":true,"ruleExpressionType":"LambdaExpression","expression":"(input.FloorId == 70 || input.FloorId == 71 || input.FloorId == 72 || input.FloorId == 73 || input.FloorId == 74 || input.FloorId == 75 || input.FloorId == 66) && (input.TypeOfUseGroupId == 2 || input.TypeOfUseGroupId == 3)","Actions":{"OnSuccess":{"Name":"MultiEffect","Context":{"effects":[{"Expression":"input.Rate * (1 - 20 / 100)","effectType":"Decrease %","value":"20","ParameterCode":"input.Rate"}]}}},"stopProcessing":false},{"RuleCode":"178071ab-9b1f-4fad-a3b9-dc001e87cb57","errorMessage":"if floor is basment then decrease rate 40%","enabled":true,"ruleExpressionType":"LambdaExpression","expression":"input.FloorId == (65)","Actions":{"OnSuccess":{"Name":"MultiEffect","Context":{"effects":[{"Expression":"input.Rate * (1 - 40 / 100)","effectType":"Decrease %","value":"40","ParameterCode":"input.Rate"}]}}},"stopProcessing":false}]}', 3, 1, 1, 1, CAST(N'2026-07-18T13:23:26.083' AS DateTime), 1, CAST(N'2026-07-20T16:09:54.283' AS DateTime), N'[{"id":"b12107d8-f611-4362-a65f-adc25f0b21a6","description":"If lower ground  floor use as Commercial  then decrees rate by 20%","conditions":{"id":"1199c91b-64f8-45ea-9be1-61a65cc43f37","logicalOperator":"AND","conditions":[{"id":"a7d96501-c76d-4821-aae2-1f90db2632f5","fieldId":"FloorId","operator":"In","value":["70","71","72","73","74","75","66"],"valueLabel":["P1 - पोडियम1","P2 - पोडियम2","P3 - पोडियम3","P4 - पोडियम4","P5 - पोडियम5","P6 - पोडियम6","L - लोअर तळमजला"]},{"id":"2a899496-e3c4-44e1-a697-5001ad33214e","fieldId":"TypeOfUseGroupId","operator":"In","value":["2","3"],"valueLabel":["C - व्यावसायिक","I - औद्योगिक"]}],"groups":[]},"effect":[{"effectType":"Decrease %","value":20,"isPercentage":true,"overrideRate":1}],"effects":[{"effectType":"Decrease %","value":20,"isPercentage":true,"overrideRate":1}],"stopProcessing":false,"ruleScopeName":"Property Level"},{"id":"178071ab-9b1f-4fad-a3b9-dc001e87cb57","description":"if floor is basment then decrease rate 40%","conditions":{"id":"6d8e28db-e68e-41c8-a59e-2d3d81471bfe","logicalOperator":"AND","conditions":[{"id":"9a5acf8e-fba4-4e52-bdc6-51829c91da5c","fieldId":"FloorId","operator":"=","value":["65"],"valueLabel":["B - तळघर"]}],"groups":[]},"effect":[{"effectType":"Decrease %","value":40,"isPercentage":true,"overrideRate":1}],"effects":[{"effectType":"Decrease %","value":40,"isPercentage":true,"overrideRate":1}],"stopProcessing":false,"ruleScopeName":"Property Level"}]', N'[{"effectType":"Decrease %","value":20,"isPercentage":true,"overrideRate":1}]', N'{}', 0, 1, 0, NULL,1)
GO

    INSERT [PTIS].[RuleEngineMaster] ([Id], [RuleCode], [RuleName], [Description], [RuleCategory], [RuleJson], [Priority], [IsEnabled], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ConditionsJson], [EffectJson], [TargetFiltersJson], [StopProcessing], [RuleScopeId], [MarkedForDeletion], [MarkedForDeletionDate],[PropertyRuleEvaluationMasterId]) 
    VALUES (3, N'RULE-20260718-0002', N'Commercial Floor Wise Decrees  20% Rate', N'Commercial Floor Wise Decrees  20% Rate', N'RV', N'{"RuleName":"Commercial Floor Wise Decrees  20% Rate","isActive":true,"RuleCategory":"RV","rules":[{"RuleCode":"a97af7b4-c73b-47ff-8182-edc5edaacf5d","errorMessage":"Floor equal to first and use is commercial then decrease rate by 10 %","enabled":true,"ruleExpressionType":"LambdaExpression","expression":"input.FloorId == 1 && (input.TypeOfUseGroupId == 2 || input.TypeOfUseGroupId == 3)","Actions":{"OnSuccess":{"Name":"MultiEffect","Context":{"effects":[{"Expression":"input.Rate * (1 - 10 / 100)","effectType":"Decrease %","value":"10","ParameterCode":"input.Rate"}]}}},"stopProcessing":false},{"RuleCode":"d4a44548-eaec-4130-8015-e0aae8749f1b","errorMessage":"Commercial Floor Wise Decrees  20% Rate","enabled":true,"ruleExpressionType":"LambdaExpression","expression":"input.FloorId > 1 && (input.TypeOfUseGroupId == 2 || input.TypeOfUseGroupId == 3)","Actions":{"OnSuccess":{"Name":"MultiEffect","Context":{"effects":[{"Expression":"input.Rate * (1 - 20 / 100)","effectType":"Decrease %","value":"20","ParameterCode":"input.Rate"}]}}},"stopProcessing":false}]}', 1, 1, 1, 1, CAST(N'2026-07-18T13:28:30.783' AS DateTime), 1, CAST(N'2026-07-22T16:33:47.763' AS DateTime), N'[{"id":"a97af7b4-c73b-47ff-8182-edc5edaacf5d","description":"Floor equal to first and use is commercial then decrease rate by 10 %","conditions":{"id":"c62c8773-3ba2-44c0-b5c1-52d607a55263","logicalOperator":"AND","conditions":[{"id":"d27481ef-a9ef-439d-a8a0-94f4f94d3ba0","fieldId":"FloorId","operator":"=","value":"1","valueLabel":"1 - पहिला मजला"},{"id":"80b4ee59-8b7d-45f0-9efc-b6f8ff0c33b7","fieldId":"TypeOfUseGroupId","operator":"In","value":["2","3"],"valueLabel":["C - व्यावसायिक","I - औद्योगिक"]}],"groups":[]},"effects":[{"effectType":"Decrease %","value":10,"isPercentage":true,"overrideRate":1}],"effect":[{"effectType":"Decrease %","value":10,"isPercentage":true,"overrideRate":1}],"ruleScopeName":"Property Level"},{"id":"d4a44548-eaec-4130-8015-e0aae8749f1b","description":"Commercial Floor Wise Decrees  20% Rate","conditions":{"id":"f6ece9b0-348f-49ce-92c0-df6264ccaca5","logicalOperator":"AND","conditions":[{"id":"49467857-4eda-45e6-8560-b0454380d421","fieldId":"FloorId","operator":">","value":"1","valueLabel":"1 - पहिला मजला"},{"id":"189bc7d5-f1f9-47f9-829f-7c2fff935245","fieldId":"TypeOfUseGroupId","operator":"In","value":["2","3"],"valueLabel":["C - व्यावसायिक","I - औद्योगिक"]}],"groups":[]},"effect":[{"effectType":"Decrease %","value":20,"isPercentage":true,"overrideRate":1}],"effects":[{"effectType":"Decrease %","value":20,"isPercentage":true,"overrideRate":1}],"stopProcessing":false,"ruleScopeName":"Property Level"}]', N'[{"effectType":"Decrease %","value":10,"isPercentage":true,"overrideRate":1}]', N'{}', 0, 1, 0, NULL,1)
GO

    INSERT [PTIS].[RuleEngineMaster] ([Id], [RuleCode], [RuleName], [Description], [RuleCategory], [RuleJson], [Priority], [IsEnabled], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ConditionsJson], [EffectJson], [TargetFiltersJson], [StopProcessing], [RuleScopeId], [MarkedForDeletion], [MarkedForDeletionDate],[PropertyRuleEvaluationMasterId])
    VALUES (4, N'RULE-20260718-0003', N'Terrace Balcony Rate 40%', N'Terrace Balcony Rate 40%', N'RV', N'{"RuleName":"Terrace Balcony Rate 40%","isActive":true,"RuleCategory":"RV","rules":[{"RuleCode":"3c947489-1e0c-41fd-8eec-8edc3563ca0d","errorMessage":"Terrace Balcony Rate 40%","enabled":true,"ruleExpressionType":"LambdaExpression","expression":"(input.TypeOfUseId == 21 || input.TypeOfUseId == 22 || input.TypeOfUseId == 84 || input.TypeOfUseId == 14031 || input.TypeOfUseId == 14032)","Actions":{"OnSuccess":{"Name":"MultiEffect","Context":{"effects":[{"Expression":"input.Rate * (1 - 60 / 100)","effectType":"Decrease %","value":"60","ParameterCode":"input.Rate"}]}}},"stopProcessing":false}]}', 1, 1, 1, 1, CAST(N'2026-07-18T13:34:54.843' AS DateTime), 1, CAST(N'2026-07-20T16:05:18.160' AS DateTime), N'[{"id":"3c947489-1e0c-41fd-8eec-8edc3563ca0d","description":"Terrace Balcony Rate 40%","conditions":{"id":"34a67af8-fcec-4c1d-b00d-f3516dc39f16","logicalOperator":"AND","conditions":[{"id":"65f4bc23-32ed-42de-9ad5-19a722dc14c3","fieldId":"TypeOfUseId","operator":"In","value":["21","22","84","14031","14032"],"valueLabel":["ABLOP - ओपन टेरेस","ABLR - टेरेस-बाल्कनी ","ABLC - टेरेस-बाल्कनी अनिवासी","ABL-EP - टेरेस-बाल्कनी शैक्षणिक","ABLRC - टेरेस-बाल्कनी-C"]}],"groups":[]},"effect":[{"effectType":"Decrease %","value":60,"isPercentage":true,"overrideRate":1}],"effects":[{"effectType":"Decrease %","value":60,"isPercentage":true,"overrideRate":1}],"stopProcessing":false,"ruleScopeName":"Property Level"}]', N'[{"effectType":"Decrease %","value":60,"isPercentage":true,"overrideRate":1}]', N'{}', 0, 1, 0, NULL,1)
GO

    INSERT [PTIS].[RuleEngineMaster] ([Id], [RuleCode], [RuleName], [Description], [RuleCategory], [RuleJson], [Priority], [IsEnabled], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ConditionsJson], [EffectJson], [TargetFiltersJson], [StopProcessing], [RuleScopeId], [MarkedForDeletion], [MarkedForDeletionDate],[PropertyRuleEvaluationMasterId])
    VALUES (5, N'RULE-20260718-0004', N'Parking Rate Decrease', N'If property use is Steel Parking the decrees rate by 50%', N'RV', N'{"RuleName":"Parking Rate Decrease","isActive":true,"RuleCategory":"RV","rules":[{"RuleCode":"ca86747c-bf92-4d94-87d6-78a7b254f016","errorMessage":"If property use is Steel Parking the decrees rate by 50%","enabled":true,"ruleExpressionType":"LambdaExpression","expression":"(input.TypeOfUseId == 2 || input.TypeOfUseId == 74 || input.TypeOfUseId == 88 || input.TypeOfUseId == 14047 || input.TypeOfUseId == 14048) && input.FloorId == 65","Actions":{"OnSuccess":{"Name":"MultiEffect","Context":{"effects":[{"Expression":"input.Rate * (1 - 50 / 100)","effectType":"Decrease %","value":"50","ParameterCode":"input.Rate"}]}}},"stopProcessing":false},{"RuleCode":"789186a6-8494-4b61-9a73-b84c399d070f","errorMessage":"If property use is Open Parking the decrees rate by 75%","enabled":true,"ruleExpressionType":"LambdaExpression","expression":"(input.TypeOfUseId == 9 || input.TypeOfUseId == 73 || input.TypeOfUseId == 87 || input.TypeOfUseId == 14045) && input.FloorId == 65","Actions":{"OnSuccess":{"Name":"MultiEffect","Context":{"effects":[{"Expression":"input.Rate * (1 - 75 / 100)","effectType":"Decrease %","value":"75","ParameterCode":"input.Rate"}]}}},"stopProcessing":false},{"RuleCode":"85801e66-4608-4eaf-b8d8-01e06b4f9d3a","errorMessage":"if Basement use as parking then decrees rate by 50%","enabled":true,"ruleExpressionType":"LambdaExpression","expression":"(input.FloorId == 65) && (input.TypeOfUseId == 9 || input.TypeOfUseId == 73 || input.TypeOfUseId == 87 || input.TypeOfUseId == 14045 || input.TypeOfUseId == 2 || input.TypeOfUseId == 74 || input.TypeOfUseId == 88 || input.TypeOfUseId == 14047 || input.TypeOfUseId == 14048)","Actions":{"OnSuccess":{"Name":"MultiEffect","Context":{"effects":[{"Expression":"input.Rate * (1 - 50 / 100)","effectType":"Decrease %","value":"50","ParameterCode":"input.Rate"}]}}},"stopProcessing":false}]}', 6, 1, 1, 1, CAST(N'2026-07-18T13:37:09.103' AS DateTime), 1, CAST(N'2026-07-18T13:50:53.333' AS DateTime), N'[{"id":"ca86747c-bf92-4d94-87d6-78a7b254f016","description":"If property use is Steel Parking the decrees rate by 50%","conditions":{"id":"75992bf0-68dd-4f1f-b3fa-ac6fcbf292b7","logicalOperator":"AND","conditions":[{"id":"dfbfaf4a-cbd5-4ed5-8f0b-e3121458fc41","fieldId":"TypeOfUseId","operator":"In","value":["2","74","88","14047","14048"],"valueLabel":["SPK - स्टील पार्किंग","SPKC - स्टील पार्किंग अनिवासी","SPKI - स्टील पार्किंग औदयोगिक","SPK-EG - स्टील पार्किंग-शैक्षणिक मालमत्ता अनुदानित","SPKR - स्टील पार्किंग-C"]},{"id":"f1267cd1-223b-4837-b03e-3bb80497f003","fieldId":"FloorId","operator":"?","value":"65","valueLabel":"B - तळघर"}],"groups":[]},"effect":[{"effectType":"Decrease %","value":50,"isPercentage":true,"overrideRate":1}],"effects":[{"effectType":"Decrease %","value":50,"isPercentage":true,"overrideRate":1}],"stopProcessing":false,"ruleScopeName":"Property Level"},{"id":"789186a6-8494-4b61-9a73-b84c399d070f","description":"If property use is Open Parking the decrees rate by 75%","conditions":{"id":"a0fe374b-39d1-4562-81f2-ac0b7821f030","logicalOperator":"AND","conditions":[{"id":"351c451d-c1c4-4b3d-9eae-6b56397673ef","fieldId":"TypeOfUseId","operator":"In","value":["9","73","87","14045"],"valueLabel":["OPK - ओपन पार्किंग","OPKC - ओपन पार्किंग अनिवासी","OPKI - ओपन पार्किंग औदयोगिक","OPK-EG - ओपन पार्किंग-शैक्षणिक मालमत्ता अनुदानित"]},{"id":"d82a68ea-036b-40a1-a754-b9721a9ca27d","fieldId":"FloorId","operator":"?","value":"65","valueLabel":"B - तळघर"}],"groups":[]},"effect":[{"effectType":"Decrease %","value":75,"isPercentage":true,"overrideRate":1}],"effects":[{"effectType":"Decrease %","value":75,"isPercentage":true,"overrideRate":1}],"stopProcessing":false,"ruleScopeName":"Property Level"},{"id":"85801e66-4608-4eaf-b8d8-01e06b4f9d3a","description":"if Basement use as parking then decrees rate by 50%","conditions":{"id":"9e6164f9-0dcb-4f90-8fae-eb8ff3f7d1bb","logicalOperator":"AND","conditions":[{"id":"390b58de-4abd-4163-903b-4e8b40673744","fieldId":"FloorId","operator":"In","value":["65"],"valueLabel":["B - तळघर"]},{"id":"7039250e-9967-4509-9890-bce0cb8bd6fe","fieldId":"TypeOfUseId","operator":"In","value":["9","73","87","14045","2","74","88","14047","14048"],"valueLabel":["OPK - ओपन पार्किंग","OPKC - ओपन पार्किंग अनिवासी","OPKI - ओपन पार्किंग औदयोगिक","OPK-EG - ओपन पार्किंग-शैक्षणिक मालमत्ता अनुदानित","SPK - स्टील पार्किंग","SPKC - स्टील पार्किंग अनिवासी","SPKI - स्टील पार्किंग औदयोगिक","SPK-EG - स्टील पार्किंग-शैक्षणिक मालमत्ता अनुदानित","SPKR - स्टील पार्किंग-C"]}],"groups":[]},"effects":[{"effectType":"Decrease %","value":50,"isPercentage":true,"overrideRate":1}],"effect":[{"effectType":"Decrease %","value":50,"isPercentage":true,"overrideRate":1}],"ruleScopeName":"Property Level"}]', N'[{"effectType":"Decrease %","value":50,"isPercentage":true,"overrideRate":1}]', N'{}', 0, 1, 0, NULL,1)
GO

    INSERT [PTIS].[RuleEngineMaster] ([Id], [RuleCode], [RuleName], [Description], [RuleCategory], [RuleJson], [Priority], [IsEnabled], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ConditionsJson], [EffectJson], [TargetFiltersJson], [StopProcessing], [RuleScopeId], [MarkedForDeletion], [MarkedForDeletionDate],[PropertyRuleEvaluationMasterId])
    VALUES (6, N'RULE-20260718-0005', N'Mezzanine Floor Rule', N'If Mezzanine Floor then rate decrease by 30%', N'RV', N'{"RuleName":"Mezzanine Floor Rule","isActive":true,"RuleCategory":"RV","rules":[{"RuleCode":"40ebdba9-a805-4391-8dab-2730c921281f","errorMessage":"If Mezzanine Floor then rate decrease by 30%   ","enabled":true,"ruleExpressionType":"LambdaExpression","expression":"input.FloorId == (76)","Actions":{"OnSuccess":{"Name":"MultiEffect","Context":{"effects":[{"Expression":"input.Rate * (1 - 30 / 100)","effectType":"Decrease %","value":"30","ParameterCode":"Rate","overrideRate":"1","overrideRateLabel":"Rate - Rate"}]}}},"stopProcessing":false}]}', 7, 1, 1, 1, CAST(N'2026-07-18T14:07:58.297' AS DateTime), 1, CAST(N'2026-07-21T13:34:14.857' AS DateTime), N'[{"id":"40ebdba9-a805-4391-8dab-2730c921281f","description":"If Mezzanine Floor then rate decrease by 30%   ","conditions":{"id":"b139740f-871d-4b92-8687-f4432827279d","logicalOperator":"AND","conditions":[{"id":"b87c8288-2edc-45c2-ab0d-b4c28514b0df","fieldId":"FloorId","operator":"=","value":["76"],"valueLabel":["M - पॉटमाळा"]}],"groups":[]},"effects":[{"effectType":"Decrease %","value":30,"isPercentage":true,"overrideRate":1,"overrideRateLabel":"Rate - Rate","parameterCode":"Rate"}],"stopProcessing":false,"ruleScopeName":"Property Level"}]', N'[{"effectType":"Decrease %","value":30,"isPercentage":true,"overrideRate":1,"overrideRateLabel":"Rate - Rate","parameterCode":"Rate"}]', N'{}', 0, 1, 0, NULL,1)
GO

    INSERT [PTIS].[RuleEngineMaster] ([Id], [RuleCode], [RuleName], [Description], [RuleCategory], [RuleJson], [Priority], [IsEnabled], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ConditionsJson], [EffectJson], [TargetFiltersJson], [StopProcessing], [RuleScopeId], [MarkedForDeletion], [MarkedForDeletionDate],[PropertyRuleEvaluationMasterId])
    VALUES (7, N'RULE-20260720-0001', N'Rented Property Rule', N'If a property is rented out and is being used for non-residential purposes, and the property tax is paid by the owner, then 20% of the total annual rent shall be considered as the taxable value for the purpose of property tax assessment.', N'RV', N'{"RuleName":"Rented Property Rule","isActive":true,"RuleCategory":"RV","rules":[{"RuleCode":"1746ff82-d571-4b3b-a49f-71161f441762","errorMessage":"If a property is rented out and is being used for non-residential purposes, and the property tax is paid by the owner, then 20% of the total annual rent shall be considered as the taxable value for the purpose of property tax assessment.","enabled":true,"ruleExpressionType":"LambdaExpression","expression":"input.IsRenter == true && (input.TypeOfUseGroupId == 2 || input.TypeOfUseGroupId == 3) && input.TaxLiability == \"Self\"","Actions":{"OnSuccess":{"Name":"MultiEffect","Context":{"effects":[{"Expression":"input.Rate * (1 - 80 / 100)","effectType":"Decrease %","value":"80","ParameterCode":"input.Rate"}]}}},"stopProcessing":false},{"RuleCode":"4fa019c9-5f88-4274-a0bb-03076f8e3242","errorMessage":"If a property is rented out and is being used for non-residential purposes, and the property tax is paid by the renter, then 40% of the total annual rent shall be considered as the taxable value for the purpose of property tax assessment.","enabled":true,"ruleExpressionType":"LambdaExpression","expression":"input.IsRenter == true && input.TaxLiability == \"Renter\" && (input.TypeOfUseGroupId == 2 || input.TypeOfUseGroupId == 3)","Actions":{"OnSuccess":{"Name":"MultiEffect","Context":{"effects":[{"Expression":"input.Rate * (1 - 60 / 100)","effectType":"Decrease %","value":"60","ParameterCode":"input.Rate"}]}}},"stopProcessing":false}]}', 8, 1, 1, 1, CAST(N'2026-07-20T18:25:10.933' AS DateTime), 1, CAST(N'2026-07-21T11:28:22.287' AS DateTime), N'[{"id":"1746ff82-d571-4b3b-a49f-71161f441762","description":"If a property is rented out and is being used for non-residential purposes, and the property tax is paid by the owner, then 20% of the total annual rent shall be considered as the taxable value for the purpose of property tax assessment.","conditions":{"id":"447d065c-4f99-4679-9de9-2417f872d824","logicalOperator":"AND","conditions":[{"id":"339875b0-fc21-41fe-886f-02a94a330723","fieldId":"IsRenter","operator":"=","value":true,"valueLabel":"True"},{"id":"0a09a6b3-4f5d-4eea-8073-e7d67b95626d","fieldId":"TypeOfUseGroupId","operator":"In","value":["2","3"],"valueLabel":["C - व्यावसायिक","I - औद्योगिक"]},{"id":"8c9991ec-7f7e-4e26-bca6-80e8416311af","fieldId":"TaxLiability","operator":"=","value":"Self","valueLabel":"Self"}],"groups":[]},"effect":[{"effectType":"Decrease %","value":80,"isPercentage":true,"overrideRate":5}],"effects":[{"effectType":"Decrease %","value":80,"isPercentage":true,"overrideRate":5}],"stopProcessing":false,"ruleScopeName":"Property Level"},{"id":"4fa019c9-5f88-4274-a0bb-03076f8e3242","description":"If a property is rented out and is being used for non-residential purposes, and the property tax is paid by the renter, then 40% of the total annual rent shall be considered as the taxable value for the purpose of property tax assessment.","conditions":{"id":"4c7d2de2-8270-4fe6-afd8-98d34311662c","logicalOperator":"AND","conditions":[{"id":"95719597-d156-4ef3-9088-ebb0ee1a65f5","fieldId":"IsRenter","operator":"=","value":true,"valueLabel":"True"},{"id":"8e6b6fcc-a725-4f72-a651-6c7a95274ce9","fieldId":"TaxLiability","operator":"=","value":"Renter","valueLabel":"Renter"},{"id":"1b5d94eb-0cd5-4f16-a456-b38861458b30","fieldId":"TypeOfUseGroupId","operator":"In","value":["2","3"],"valueLabel":["C - व्यावसायिक","I - औद्योगिक"]}],"groups":[]},"effect":[{"effectType":"Decrease %","value":60,"isPercentage":true,"overrideRate":5}],"effects":[{"effectType":"Decrease %","value":60,"isPercentage":true,"overrideRate":5}],"stopProcessing":false,"ruleScopeName":"Property Level"}]', N'[{"effectType":"Decrease %","value":80,"isPercentage":true,"overrideRate":5}]', N'{}', 0, 1, 0, NULL,1)
GO

    INSERT [PTIS].[RuleEngineMaster] ([Id], [RuleCode], [RuleName], [Description], [RuleCategory], [RuleJson], [Priority], [IsEnabled], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate], [ConditionsJson], [EffectJson], [TargetFiltersJson], [StopProcessing], [RuleScopeId], [MarkedForDeletion], [MarkedForDeletionDate],[PropertyRuleEvaluationMasterId])
    VALUES (8, N'RULE-20260720-0002', N'Parking use as a Residential  or Commercial', N'if original sanction plan is Parking but current  use as a Residential  or Commercial  then apply 3 Times tax', N'RV', N'{"RuleName":"Parking use as a Residential  or Commercial","isActive":true,"RuleCategory":"RV","rules":[{"RuleCode":"2bf0b453-d273-4d4f-884e-5eee095b05bc","errorMessage":"if original sanction plan is Parking but current  use as a Residential  or Commercial  then apply 3 Times tax","enabled":true,"ruleExpressionType":"LambdaExpression","expression":"input.TypeOfUseId == 14048","Actions":{"OnSuccess":{"Name":"MultiEffect","Context":{"effects":[{"Expression":"input.Rate * 3","effectType":"Multiply","value":"3","ParameterCode":"input.Rate"}]}}},"stopProcessing":false}]}', 8, 1, 1, 1, CAST(N'2026-07-20T18:40:53.097' AS DateTime), NULL, NULL, N'[{"id":"2bf0b453-d273-4d4f-884e-5eee095b05bc","description":"if original sanction plan is Parking but current  use as a Residential  or Commercial  then apply 3 Times tax","conditions":{"id":"fa05f608-03ef-4987-a920-e5b8f13e68f4","logicalOperator":"AND","conditions":[{"id":"25cb79d2-24ac-42dc-bc0a-35619d9c214b","fieldId":"TypeOfUseId","operator":"=","value":"14048","valueLabel":"SPKR - स्टील पार्किंग-C"}],"groups":[]},"effect":[{"effectType":"Multiply","value":3,"isPercentage":true,"overrideRate":1}],"effects":[{"effectType":"Multiply","value":3,"isPercentage":true,"overrideRate":1}],"stopProcessing":false,"ruleScopeName":"Property Level"}]', N'[{"effectType":"Multiply","value":3,"isPercentage":true,"overrideRate":1}]', N'{}', 0, 1, 0, NULL,1)
GO

SET IDENTITY_INSERT [PTIS].[RuleEngineMaster] OFF
GO
/* ============================================================================
   Seed PTIS.ULBDocumentType
============================================================================ */

SET IDENTITY_INSERT [PTIS].[ULBDocumentType] ON;

INSERT INTO PTIS.ULBDocumentType
(
    Id,
    DocumentTypeCode,
    DocumentTypeName,
    IsActive,
    CreatedBy
)
SELECT
    v.Id,
    v.DocumentTypeCode,
    v.DocumentTypeName,
    1,
    1
FROM (VALUES
    (1, 'READY_RECKONER_RATE_CHART', 'Ready Reckoner Rate Chart'),
    (2, 'TAX_ZONING_DOCUMENT',       'Tax Zoning Document'),
    (3, 'TAX_RATE_CHART',            'Tax Rate Chart'),
    (4, 'WARD_ZONE_MAP',             'Ward / Zone Map'),
    (5, 'ASSESSMENT_RULE_DOCUMENT',  'Assessment Rule Document'),
    (6, 'GOVERNMENT_CIRCULAR',       'Government Circular / GR'),
    (7, 'PENALTY_INTEREST_RULE',     'Penalty / Interest Rule Document'),
    (8, 'EXEMPTION_RULE_DOCUMENT',   'Exemption Rule Document')
) v
(
    Id,
    DocumentTypeCode,
    DocumentTypeName
)
WHERE NOT EXISTS
(
    SELECT 1
    FROM PTIS.ULBDocumentType t
    WHERE t.DocumentTypeCode = v.DocumentTypeCode
);

SET IDENTITY_INSERT [PTIS].[ULBDocumentType] OFF;
GO


/* ============================================================
   PTIS RETROSPECTIVE RULE CONFIGURATION SEED DATA

   Rules seeded:
   - THA-01 to THA-10
   - PCM-01 to PCM-06
   - FUR-01 to FUR-04

   Note:
   Since ULBId is removed, all rules are saved in one rule library.
   During calculation, match only:
       RuleStatus = 'Active'
       IsActive = 1

   If some old corporation reference rules are not required for current ULB,
   keep them as Review / Draft or set IsActive = 0.
============================================================ */

------------------------------------------------------------
-- 1. Ensure Evidence Master Data
------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM PTIS.EvidenceTypeMaster WHERE EvidenceCode = 'OC')
    INSERT INTO PTIS.EvidenceTypeMaster (EvidenceCode, EvidenceName, IsCertificate, DisplayOrder, IsActive, CreatedBy)
    VALUES ('OC', 'OC', 1, 1, 1, 1);
GO
IF NOT EXISTS (SELECT 1 FROM PTIS.EvidenceTypeMaster WHERE EvidenceCode = 'CC')
    INSERT INTO PTIS.EvidenceTypeMaster (EvidenceCode, EvidenceName, IsCertificate, DisplayOrder, IsActive, CreatedBy)
    VALUES ('CC', 'CC', 1, 2, 1, 1);
GO
IF NOT EXISTS (SELECT 1 FROM PTIS.EvidenceTypeMaster WHERE EvidenceCode = 'ELECTRICITY')
    INSERT INTO PTIS.EvidenceTypeMaster (EvidenceCode, EvidenceName, IsCertificate, DisplayOrder, IsActive, CreatedBy)
    VALUES ('ELECTRICITY', 'Electricity', 0, 3, 1, 1);
GO
IF NOT EXISTS (SELECT 1 FROM PTIS.EvidenceTypeMaster WHERE EvidenceCode = 'CHANGE_DETECTION')
    INSERT INTO PTIS.EvidenceTypeMaster (EvidenceCode, EvidenceName, IsCertificate, DisplayOrder, IsActive, CreatedBy)
    VALUES ('CHANGE_DETECTION', 'Change Detection', 0, 4, 1, 1);
GO
IF NOT EXISTS (SELECT 1 FROM PTIS.EvidenceTypeMaster WHERE EvidenceCode = 'CONSTRUCTION_YEAR')
    INSERT INTO PTIS.EvidenceTypeMaster (EvidenceCode, EvidenceName, IsCertificate, DisplayOrder, IsActive, CreatedBy)
    VALUES ('CONSTRUCTION_YEAR', 'Construction Year', 0, 5, 1, 1);
GO


------------------------------------------------------------
-- 2. Rule Master
------------------------------------------------------------
INSERT INTO PTIS.RetrospectiveRuleMaster
(
    RuleCode,
    RuleName,
    RuleDescription,
    PriorityNo,
    MatchType,
    IsFallbackRule,
    RuleStatus,
    AuthorizationStatus,
    LegalCapEnabled,
    LegalCapYears,
    NoticeDays,
    VersionNo,
    EffectiveFrom,
    IsActive,
    Remarks,
    CreatedBy
)
SELECT
    v.RuleCode,
    v.RuleName,
    v.RuleDescription,
    v.PriorityNo,
    v.MatchType,
    v.IsFallbackRule,
    v.RuleStatus,
    v.AuthorizationStatus,
    v.LegalCapEnabled,
    v.LegalCapYears,
    v.NoticeDays,
    v.VersionNo,
    v.EffectiveFrom,
    v.IsActive,
    v.Remarks,
    1
FROM (VALUES
    ('THA-10', 'OC + CC within 6 months - OC alone', 'Both OC and CC are available, and the CC-to-OC gap is within 6 months. Retrospective tax starts from OC date alone (CC is not billed separately).', 4, 'CONDITION_BASED', 0, 'Active', 'AUTHORIZED', 1, 6, 15, '1.0', '2026-04-01', 1, 'OC + CC gap within 6 months -- OC governs alone.'),
    ('THA-09', 'OC + CC gap exceeds 6 months - 1.5x from CC to OC, then 1x', 'Both OC and CC are available, and the CC-to-OC gap exceeds 6 months. Retrospective tax starts from CC date. Tax is 1.5x from CC to OC and 1x after OC.', 5, 'CONDITION_BASED', 0, 'Active', 'AUTHORIZED', 1, 6, 15, '1.0', '2026-04-01', 1, 'OC + CC gap exceeds 6 months -- CC-then-OC merge, 1.5x/1x split multiplier rule.'),
    ('THA-01', 'OC evidence - start from OC date', 'Only OC is available. Retrospective tax applicable from OC date.', 10, 'CONDITION_BASED', 0, 'Active', 'AUTHORIZED', 1, 6, 15, '1.0', '2026-04-01', 1, 'OC evidence available.'),
    ('THA-02', 'CC evidence - start from CC date', 'Only CC is available. Retrospective tax applicable from CC date.', 20, 'CONDITION_BASED', 0, 'Active', 'AUTHORIZED', 1, 6, 15, '1.0', '2026-04-01', 1, 'CC evidence available.'),
    ('THA-03', 'CC + electricity earlier than CC', 'CC and electricity available. Electricity date is before CC date. Retrospective tax starts from CC date with 1.5 multiplier.', 30, 'CONDITION_BASED', 0, 'Active', 'AUTHORIZED', 1, 6, 15, '1.0', '2026-04-01', 1, 'CC plus electricity before CC.'),
    ('THA-04', 'CC + electricity later than CC', 'CC and electricity available. Electricity date is after CC date. Retrospective tax starts from electricity date with 1.5 multiplier.', 40, 'CONDITION_BASED', 0, 'Active', 'AUTHORIZED', 1, 6, 15, '1.0', '2026-04-01', 1, 'CC plus electricity after CC.'),
    ('THA-05', 'Only electricity before 2016 cutoff', 'Only electricity bill date is available and electricity date is before cutoff date 01-Apr-2016.', 50, 'CONDITION_BASED', 0, 'Review', 'UNAUTHORIZED', 1, 6, 15, '1.0', '2026-04-01', 1, 'Unauthorized construction penalty applicable as per Act.'),
    ('THA-06', 'Only electricity after 2016 cutoff', 'Only electricity bill date is available and electricity date is after cutoff date 01-Apr-2016.', 60, 'CONDITION_BASED', 0, 'Review', 'UNAUTHORIZED', 1, 6, 15, '1.0', '2026-04-01', 1, 'Unauthorized construction penalty applicable as per Act.'),
    ('THA-07', 'Change detection fallback', 'OC, CC and electricity are not available. Change detection date is available.', 70, 'CONDITION_BASED', 1, 'Review', 'UNAUTHORIZED', 1, 6, 15, '1.0', '2026-04-01', 1, 'Fallback rule based on change detection.'),
    ('THA-08', 'Construction year final fallback', 'OC, CC, electricity and change detection are not available. Construction year is available.', 80, 'CONDITION_BASED', 1, 'Review', 'UNAUTHORIZED', 1, 6, 15, '1.0', '2026-04-01', 1, 'Final fallback based on construction year.'),
    ('PCM-01', 'OC older than six years', 'Only OC is available and OC date is older than allowed six-year period.', 110, 'CONDITION_BASED', 0, 'Active', 'AUTHORIZED', 1, 6, 15, '1.0', '2026-04-01', 1, 'OC older than six years.'),
    ('PCM-02', 'OC within six years', 'Only OC is available and OC date is within allowed six-year period.', 120, 'CONDITION_BASED', 0, 'Active', 'AUTHORIZED', 1, 6, 15, '1.0', '2026-04-01', 1, 'OC within six years.'),
    ('PCM-05', 'CC + electricity - use electricity date', 'CC and electricity are available. OC is unavailable. Retrospective tax starts from electricity date.', 125, 'CONDITION_BASED', 0, 'Active', 'AUTHORIZED', 1, 6, 15, '1.0', '2026-04-01', 1, 'Specific CC + electricity rule. Priority kept before only CC rule.'),
    ('PCM-03', 'Only CC - next financial year', 'Only CC is available. Retrospective tax starts from next financial year after CC date.', 130, 'CONDITION_BASED', 0, 'Active', 'AUTHORIZED', 1, 6, 15, '1.0', '2026-04-01', 1, 'CC date plus next financial year start.'),
    ('PCM-04', 'Only electricity - align to 1 April', 'Only electricity date is available. Retrospective tax starts from 1 April of electricity financial year.', 140, 'CONDITION_BASED', 0, 'NeedsClarification', 'UNAUTHORIZED', 1, 6, 15, '1.0', '2026-04-01', 1, 'Penalty date wording has unclear gap and requires policy confirmation.'),
    ('PCM-06', 'No evidence - construction year or cap', 'OC, CC and electricity are unavailable. Construction year is available. Start from later of construction date or six-year cap.', 160, 'CONDITION_BASED', 1, 'NeedsClarification', 'UNAUTHORIZED', 1, 6, 15, '1.0', '2026-04-01', 1, 'Penalty source refers to electricity date even though electricity is unavailable. Manual review required.'),
    ('FUR-01', 'OC older than six years', 'Only OC is available and OC date is older than six-year period.', 210, 'CONDITION_BASED', 0, 'Active', 'AUTHORIZED', 1, 6, 15, '1.0', '2026-04-01', 1, 'OC older than six years.'),
    ('FUR-02', 'OC within six years', 'Only OC is available and OC date is within six-year period.', 220, 'CONDITION_BASED', 0, 'Active', 'AUTHORIZED', 1, 6, 15, '1.0', '2026-04-01', 1, 'OC within six years.'),
    ('FUR-03', 'No evidence - September 2024 cutoff', 'OC and CC are unavailable. Construction year is available. Retrospective tax starts from fixed September 2024 cutoff.', 230, 'CONDITION_BASED', 1, 'Review', 'UNAUTHORIZED', 1, 6, 15, '1.0', '2024-09-01', 1, 'Unauthorized construction penalty applicable as per Act.'),
    ('FUR-04', 'Electricity after cutoff - add six months', 'Only electricity date is available and electricity date is after September 2024 cutoff. Retrospective starts six months after electricity date.', 240, 'CONDITION_BASED', 0, 'Review', 'UNAUTHORIZED', 1, 6, 15, '1.0', '2024-09-01', 1, 'Unauthorized construction penalty applicable as per Act.')
) v
(
    RuleCode, RuleName, RuleDescription, PriorityNo, MatchType, IsFallbackRule, RuleStatus,
    AuthorizationStatus, LegalCapEnabled, LegalCapYears, NoticeDays, VersionNo, EffectiveFrom,
    IsActive, Remarks
)
WHERE NOT EXISTS
(
    SELECT 1
    FROM PTIS.RetrospectiveRuleMaster t
    WHERE t.RuleCode = v.RuleCode
);
GO


------------------------------------------------------------
-- 3. Rule Evidence Conditions
------------------------------------------------------------
INSERT INTO PTIS.RetrospectiveRuleEvidenceCondition
(
    RuleId,
    EvidenceTypeId,
    EvidenceState,
    IsActive,
    CreatedBy
)
SELECT
    R.Id,
    ET.Id,
    v.EvidenceState,
    1,
    1
FROM (VALUES
    ('THA-01', 'OC', 'AVAILABLE'),
    ('THA-01', 'CC', 'UNAVAILABLE'),
    ('THA-01', 'ELECTRICITY', 'UNAVAILABLE'),
    ('THA-01', 'CHANGE_DETECTION', 'UNAVAILABLE'),
    ('THA-02', 'CC', 'AVAILABLE'),
    ('THA-02', 'OC', 'UNAVAILABLE'),
    ('THA-02', 'ELECTRICITY', 'UNAVAILABLE'),
    ('THA-02', 'CHANGE_DETECTION', 'UNAVAILABLE'),
    ('THA-03', 'CC', 'AVAILABLE'),
    ('THA-03', 'ELECTRICITY', 'AVAILABLE'),
    ('THA-03', 'OC', 'UNAVAILABLE'),
    ('THA-03', 'CHANGE_DETECTION', 'UNAVAILABLE'),
    ('THA-04', 'CC', 'AVAILABLE'),
    ('THA-04', 'ELECTRICITY', 'AVAILABLE'),
    ('THA-04', 'OC', 'UNAVAILABLE'),
    ('THA-04', 'CHANGE_DETECTION', 'UNAVAILABLE'),
    ('THA-05', 'ELECTRICITY', 'AVAILABLE'),
    ('THA-05', 'OC', 'UNAVAILABLE'),
    ('THA-05', 'CC', 'UNAVAILABLE'),
    ('THA-05', 'CHANGE_DETECTION', 'UNAVAILABLE'),
    ('THA-06', 'ELECTRICITY', 'AVAILABLE'),
    ('THA-06', 'OC', 'UNAVAILABLE'),
    ('THA-06', 'CC', 'UNAVAILABLE'),
    ('THA-06', 'CHANGE_DETECTION', 'UNAVAILABLE'),
    ('THA-07', 'CHANGE_DETECTION', 'AVAILABLE'),
    ('THA-07', 'OC', 'UNAVAILABLE'),
    ('THA-07', 'CC', 'UNAVAILABLE'),
    ('THA-07', 'ELECTRICITY', 'UNAVAILABLE'),
    ('THA-08', 'CONSTRUCTION_YEAR', 'AVAILABLE'),
    ('THA-08', 'OC', 'UNAVAILABLE'),
    ('THA-08', 'CC', 'UNAVAILABLE'),
    ('THA-08', 'ELECTRICITY', 'UNAVAILABLE'),
    ('THA-08', 'CHANGE_DETECTION', 'UNAVAILABLE'),
    ('THA-09', 'OC', 'AVAILABLE'),
    ('THA-09', 'CC', 'AVAILABLE'),
    ('THA-10', 'OC', 'AVAILABLE'),
    ('THA-10', 'CC', 'AVAILABLE'),
    ('PCM-01', 'OC', 'AVAILABLE'),
    ('PCM-01', 'CC', 'UNAVAILABLE'),
    ('PCM-01', 'ELECTRICITY', 'UNAVAILABLE'),
    ('PCM-01', 'CHANGE_DETECTION', 'UNAVAILABLE'),
    ('PCM-02', 'OC', 'AVAILABLE'),
    ('PCM-02', 'CC', 'UNAVAILABLE'),
    ('PCM-02', 'ELECTRICITY', 'UNAVAILABLE'),
    ('PCM-02', 'CHANGE_DETECTION', 'UNAVAILABLE'),
    ('PCM-03', 'CC', 'AVAILABLE'),
    ('PCM-03', 'OC', 'UNAVAILABLE'),
    ('PCM-03', 'ELECTRICITY', 'UNAVAILABLE'),
    ('PCM-03', 'CHANGE_DETECTION', 'UNAVAILABLE'),
    ('PCM-04', 'ELECTRICITY', 'AVAILABLE'),
    ('PCM-04', 'OC', 'UNAVAILABLE'),
    ('PCM-04', 'CC', 'UNAVAILABLE'),
    ('PCM-04', 'CHANGE_DETECTION', 'UNAVAILABLE'),
    ('PCM-05', 'CC', 'AVAILABLE'),
    ('PCM-05', 'ELECTRICITY', 'AVAILABLE'),
    ('PCM-05', 'OC', 'UNAVAILABLE'),
    ('PCM-05', 'CHANGE_DETECTION', 'UNAVAILABLE'),
    ('PCM-06', 'CONSTRUCTION_YEAR', 'AVAILABLE'),
    ('PCM-06', 'OC', 'UNAVAILABLE'),
    ('PCM-06', 'CC', 'UNAVAILABLE'),
    ('PCM-06', 'ELECTRICITY', 'UNAVAILABLE'),
    ('PCM-06', 'CHANGE_DETECTION', 'UNAVAILABLE'),
    ('FUR-01', 'OC', 'AVAILABLE'),
    ('FUR-01', 'CC', 'UNAVAILABLE'),
    ('FUR-01', 'ELECTRICITY', 'UNAVAILABLE'),
    ('FUR-01', 'CHANGE_DETECTION', 'UNAVAILABLE'),
    ('FUR-02', 'OC', 'AVAILABLE'),
    ('FUR-02', 'CC', 'UNAVAILABLE'),
    ('FUR-02', 'ELECTRICITY', 'UNAVAILABLE'),
    ('FUR-02', 'CHANGE_DETECTION', 'UNAVAILABLE'),
    ('FUR-03', 'CONSTRUCTION_YEAR', 'AVAILABLE'),
    ('FUR-03', 'OC', 'UNAVAILABLE'),
    ('FUR-03', 'CC', 'UNAVAILABLE'),
    ('FUR-03', 'ELECTRICITY', 'UNAVAILABLE'),
    ('FUR-03', 'CHANGE_DETECTION', 'UNAVAILABLE'),
    ('FUR-04', 'ELECTRICITY', 'AVAILABLE'),
    ('FUR-04', 'OC', 'UNAVAILABLE'),
    ('FUR-04', 'CC', 'UNAVAILABLE'),
    ('FUR-04', 'CHANGE_DETECTION', 'UNAVAILABLE')
) v (RuleCode, EvidenceCode, EvidenceState)
INNER JOIN PTIS.RetrospectiveRuleMaster R
    ON R.RuleCode = v.RuleCode
INNER JOIN PTIS.EvidenceTypeMaster ET
    ON ET.EvidenceCode = v.EvidenceCode
WHERE NOT EXISTS
(
    SELECT 1
    FROM PTIS.RetrospectiveRuleEvidenceCondition t
    WHERE t.RuleId = R.Id
      AND t.EvidenceTypeId = ET.Id
);
GO


------------------------------------------------------------
-- 4. Rule Date Conditions
------------------------------------------------------------
INSERT INTO PTIS.RetrospectiveRuleDateCondition
(
    RuleId,
    ComparatorCode,
    LeftEvidenceTypeId,
    RightEvidenceTypeId,
    CompareOperator,
    CompareDate,
    CompareDateTo,
    CompareYears,
    CompareGapUnit,
    IsActive,
    CreatedBy
)
SELECT
    R.Id,
    v.ComparatorCode,
    LET.Id,
    RET.Id,
    v.CompareOperator,
    v.CompareDate,
    v.CompareDateTo,
    v.CompareYears,
    v.CompareGapUnit,
    1,
    1
FROM (VALUES
    ('THA-01', 'NONE', NULL, NULL, NULL, NULL, CAST(NULL AS DATE), NULL, NULL),
    ('THA-02', 'NONE', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('THA-03', 'ELECTRICITY_BEFORE_CC', 'ELECTRICITY', 'CC', 'BEFORE', NULL, NULL, NULL, NULL),
    ('THA-04', 'ELECTRICITY_AFTER_CC', 'ELECTRICITY', 'CC', 'AFTER', NULL, NULL, NULL, NULL),
    ('THA-05', 'ELECTRICITY_BEFORE_CUTOFF', 'ELECTRICITY', NULL, 'BEFORE', '2016-04-01', NULL, NULL, NULL),
    ('THA-06', 'ELECTRICITY_AFTER_CUTOFF', 'ELECTRICITY', NULL, 'AFTER', '2016-04-01', NULL, NULL, NULL),
    ('THA-07', 'NONE', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('THA-08', 'NONE', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('THA-09', 'EVIDENCE_GAP_WITHIN_PERIOD', 'CC', 'OC', 'OLDER_THAN_YEARS', NULL, NULL, 6, 'MONTHS'),
    ('THA-10', 'EVIDENCE_GAP_WITHIN_PERIOD', 'CC', 'OC', 'WITHIN_YEARS', NULL, NULL, 6, 'MONTHS'),
    ('PCM-01', 'OC_OLDER_THAN_ALLOWED_PERIOD', 'OC', NULL, 'OLDER_THAN_YEARS', NULL, NULL, 6, NULL),
    ('PCM-02', 'OC_WITHIN_ALLOWED_PERIOD', 'OC', NULL, 'WITHIN_YEARS', NULL, NULL, 6, NULL),
    ('PCM-03', 'NONE', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('PCM-04', 'NONE', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('PCM-05', 'NONE', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('PCM-06', 'NONE', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('FUR-01', 'OC_OLDER_THAN_ALLOWED_PERIOD', 'OC', NULL, 'OLDER_THAN_YEARS', NULL, NULL, 6, NULL),
    ('FUR-02', 'OC_WITHIN_ALLOWED_PERIOD', 'OC', NULL, 'WITHIN_YEARS', NULL, NULL, 6, NULL),
    ('FUR-03', 'NONE', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('FUR-04', 'ELECTRICITY_AFTER_CUTOFF', 'ELECTRICITY', NULL, 'AFTER', '2024-09-01', NULL, NULL, NULL)
) v (RuleCode, ComparatorCode, LeftEvidenceCode, RightEvidenceCode, CompareOperator, CompareDate, CompareDateTo, CompareYears, CompareGapUnit)
INNER JOIN PTIS.RetrospectiveRuleMaster R
    ON R.RuleCode = v.RuleCode
LEFT JOIN PTIS.EvidenceTypeMaster LET
    ON LET.EvidenceCode = v.LeftEvidenceCode
LEFT JOIN PTIS.EvidenceTypeMaster RET
    ON RET.EvidenceCode = v.RightEvidenceCode
WHERE NOT EXISTS
(
    SELECT 1
    FROM PTIS.RetrospectiveRuleDateCondition t
    WHERE t.RuleId = R.Id
);
GO


------------------------------------------------------------
-- 5. Rule Actions
------------------------------------------------------------
INSERT INTO PTIS.RetrospectiveRuleAction
(
    RuleId,
    TaxStartMode,
    StartEvidenceTypeId,
    OffsetMonths,
    RetrospectiveLimitType,
    MaximumYears,
    CutoffDate,
    TaxCalculationMode,
    TaxMultiplier,
    SplitStartEvidenceTypeId,
    SplitEndEvidenceTypeId,
    SplitMultiplier,
    AfterSplitMultiplier,
    RateMode,
    IsActive,
    CreatedBy
)
SELECT
    R.Id,
    v.TaxStartMode,
    SETM.Id,
    v.OffsetMonths,
    v.RetrospectiveLimitType,
    v.MaximumYears,
    v.CutoffDate,
    v.TaxCalculationMode,
    v.TaxMultiplier,
    SSETM.Id,
    SEETM.Id,
    v.SplitMultiplier,
    v.AfterSplitMultiplier,
    v.RateMode,
    1,
    1
FROM (VALUES
    -- Thane: rate & tax % as per each retrospective year (year-wise historical rate).
    ('THA-01', 'EVIDENCE_DATE', 'OC', NULL, 'FIXED_CUTOFF_DATE', NULL, '2016-04-01', 'SINGLE', 1.00, NULL, NULL, NULL, NULL, 'YEAR_WISE'),
    ('THA-02', 'EVIDENCE_DATE', 'CC', NULL, 'FIXED_CUTOFF_DATE', NULL, '2016-04-01', 'SINGLE', 1.00, NULL, NULL, NULL, NULL, 'YEAR_WISE'),
    ('THA-03', 'EVIDENCE_DATE', 'CC', NULL, 'FIXED_CUTOFF_DATE', NULL, '2016-04-01', 'SINGLE', 1.50, NULL, NULL, NULL, NULL, 'YEAR_WISE'),
    ('THA-04', 'EVIDENCE_DATE', 'ELECTRICITY', NULL, 'FIXED_CUTOFF_DATE', NULL, '2016-04-01', 'SINGLE', 1.50, NULL, NULL, NULL, NULL, 'YEAR_WISE'),
    ('THA-05', 'FIXED_CUTOFF', NULL, NULL, 'FIXED_CUTOFF_DATE', NULL, '2016-04-01', 'SINGLE', 1.00, NULL, NULL, NULL, NULL, 'YEAR_WISE'),
    ('THA-06', 'EVIDENCE_DATE', 'ELECTRICITY', NULL, 'FIXED_CUTOFF_DATE', NULL, '2016-04-01', 'SINGLE', 1.00, NULL, NULL, NULL, NULL, 'YEAR_WISE'),
    ('THA-07', 'EVIDENCE_DATE', 'CHANGE_DETECTION', NULL, 'FIXED_CUTOFF_DATE', NULL, '2016-04-01', 'SINGLE', 1.00, NULL, NULL, NULL, NULL, 'YEAR_WISE'),
    ('THA-08', 'CONSTRUCTION_YEAR', 'CONSTRUCTION_YEAR', NULL, 'FIXED_CUTOFF_DATE', NULL, '2016-04-01', 'SINGLE', 1.00, NULL, NULL, NULL, NULL, 'YEAR_WISE'),
    ('THA-09', 'EVIDENCE_DATE', 'CC', NULL, 'FIXED_CUTOFF_DATE', NULL, '2016-04-01', 'CC_THEN_OC_MERGE', 1.00, 'CC', 'OC', 1.50, 1.00, 'YEAR_WISE'),
    ('THA-10', 'EVIDENCE_DATE', 'OC', NULL, 'FIXED_CUTOFF_DATE', NULL, '2016-04-01', 'SINGLE', 1.00, NULL, NULL, NULL, NULL, 'YEAR_WISE'),
    -- PCMC: rate & tax % as per the current assessment year for every retrospective year.
    -- PCM-01 / FUR-01 carry 'OC' as start evidence only to pick the OC policy family (PolicyCodeMaster
    -- OC / PARTIAL_OC); their start date still comes entirely from the MAX_LOOK_BACK_DATE limit.
    ('PCM-01', 'MAX_LOOK_BACK_DATE', 'OC', NULL, 'MAXIMUM_YEARS', 6, NULL, 'SINGLE', 1.00, NULL, NULL, NULL, NULL, 'CURRENT_YEAR'),
    ('PCM-02', 'EVIDENCE_DATE', 'OC', NULL, 'MAXIMUM_YEARS', 6, NULL, 'SINGLE', 1.00, NULL, NULL, NULL, NULL, 'CURRENT_YEAR'),
    ('PCM-03', 'NEXT_FINANCIAL_YEAR', 'CC', NULL, 'MAXIMUM_YEARS', 6, NULL, 'SINGLE', 1.00, NULL, NULL, NULL, NULL, 'CURRENT_YEAR'),
    ('PCM-04', 'FY_START', 'ELECTRICITY', NULL, 'MAXIMUM_YEARS', 6, NULL, 'SINGLE', 1.00, NULL, NULL, NULL, NULL, 'CURRENT_YEAR'),
    ('PCM-05', 'EVIDENCE_DATE', 'ELECTRICITY', NULL, 'MAXIMUM_YEARS', 6, NULL, 'SINGLE', 1.00, NULL, NULL, NULL, NULL, 'CURRENT_YEAR'),
    ('PCM-06', 'CONSTRUCTION_OR_CAP', 'CONSTRUCTION_YEAR', NULL, 'MAXIMUM_YEARS', 6, NULL, 'SINGLE', 1.00, NULL, NULL, NULL, NULL, 'CURRENT_YEAR'),
    -- Fursungi: rate & tax % as per the current assessment year for every retrospective year.
    ('FUR-01', 'MAX_LOOK_BACK_DATE', 'OC', NULL, 'MAXIMUM_YEARS', 6, NULL, 'SINGLE', 1.00, NULL, NULL, NULL, NULL, 'CURRENT_YEAR'),
    ('FUR-02', 'EVIDENCE_DATE', 'OC', NULL, 'MAXIMUM_YEARS', 6, NULL, 'SINGLE', 1.00, NULL, NULL, NULL, NULL, 'CURRENT_YEAR'),
    ('FUR-03', 'FIXED_CUTOFF', NULL, NULL, 'FIXED_CUTOFF_DATE', NULL, '2024-09-01', 'SINGLE', 1.00, NULL, NULL, NULL, NULL, 'CURRENT_YEAR'),
    ('FUR-04', 'MONTHS_AFTER', 'ELECTRICITY', 6, 'FIXED_CUTOFF_DATE', NULL, '2024-09-01', 'SINGLE', 1.00, NULL, NULL, NULL, NULL, 'CURRENT_YEAR')
) v (RuleCode, TaxStartMode, StartEvidenceCode, OffsetMonths, RetrospectiveLimitType, MaximumYears, CutoffDate, TaxCalculationMode, TaxMultiplier, SplitStartEvidenceCode, SplitEndEvidenceCode, SplitMultiplier, AfterSplitMultiplier, RateMode)
INNER JOIN PTIS.RetrospectiveRuleMaster R
    ON R.RuleCode = v.RuleCode
LEFT JOIN PTIS.EvidenceTypeMaster SETM
    ON SETM.EvidenceCode = v.StartEvidenceCode
LEFT JOIN PTIS.EvidenceTypeMaster SSETM
    ON SSETM.EvidenceCode = v.SplitStartEvidenceCode
LEFT JOIN PTIS.EvidenceTypeMaster SEETM
    ON SEETM.EvidenceCode = v.SplitEndEvidenceCode
WHERE NOT EXISTS
(
    SELECT 1
    FROM PTIS.RetrospectiveRuleAction t
    WHERE t.RuleId = R.Id
);
GO


------------------------------------------------------------
-- 6. Penalty Rules
------------------------------------------------------------
INSERT INTO PTIS.RetrospectivePenaltyRule
(
    RuleId,
    IsPenaltyApplicable,
    PenaltyMode,
    PenaltyPercent,
    PenaltyDateSourceType,
    PenaltyDateEvidenceTypeId,
    PenaltyDateCondition,
    CompareDate,
    CompareDateTo,
    ElseAction,
    RequiresManualReview,
    Remarks,
    IsActive,
    CreatedBy
)
SELECT
    R.Id,
    v.IsPenaltyApplicable,
    v.PenaltyMode,
    v.PenaltyPercent,
    v.PenaltyDateSourceType,
    ET.Id,
    v.PenaltyDateCondition,
    v.CompareDate,
    v.CompareDateTo,
    v.ElseAction,
    v.RequiresManualReview,
    v.Remarks,
    1,
    1
FROM (VALUES
    ('THA-01', 0, 'NONE', CAST(NULL AS DECIMAL(10,2)), NULL, NULL, NULL, NULL, CAST(NULL AS DATE), NULL, 0, 'Penalty not applicable because OC or CC is available.'),
    ('THA-02', 0, 'NONE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'Penalty not applicable because OC or CC is available.'),
    ('THA-03', 0, 'NONE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'Penalty not applicable because OC or CC is available.'),
    ('THA-04', 0, 'NONE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'Penalty not applicable because OC or CC is available.'),
    ('THA-09', 0, 'NONE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'Penalty not applicable because OC or CC is available.'),
    ('THA-10', 0, 'NONE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'Penalty not applicable because OC or CC is available.'),
    ('THA-05', 1, 'ACT_PENALTY', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'Apply unauthorized construction penalty as per Act.'),
    ('THA-06', 1, 'ACT_PENALTY', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'Apply unauthorized construction penalty as per Act.'),
    ('THA-07', 1, 'ACT_PENALTY', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'Apply unauthorized construction penalty as per Act.'),
    ('THA-08', 1, 'ACT_PENALTY', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'Apply unauthorized construction penalty as per Act.'),
    ('PCM-01', 0, 'NONE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'Penalty not applicable because OC or CC is available.'),
    ('PCM-02', 0, 'NONE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'Penalty not applicable because OC or CC is available.'),
    ('PCM-03', 0, 'NONE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'Penalty not applicable because OC or CC is available.'),
    ('PCM-05', 0, 'NONE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'Penalty not applicable because OC or CC is available.'),
    ('PCM-04', 1, 'DATE_VALIDATION', NULL, 'EVIDENCE_DATE', 'ELECTRICITY', 'ON_OR_AFTER', '2026-03-03', NULL, 'MANUAL_REVIEW', 1, 'Apply penalty if electricity date is on or after 03-Mar-2026. Other cases require manual review due to unclear policy wording.'),
    ('PCM-06', 1, 'DATE_VALIDATION', NULL, 'EVIDENCE_DATE', 'ELECTRICITY', 'ON_OR_AFTER', '2026-03-03', NULL, 'MANUAL_REVIEW', 1, 'Policy conflict: electricity is marked unavailable but penalty source uses electricity date. Manual review required.'),
    ('FUR-01', 0, 'NONE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'Penalty not applicable because OC or CC is available.'),
    ('FUR-02', 0, 'NONE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'Penalty not applicable because OC or CC is available.'),
    ('FUR-03', 1, 'ACT_PENALTY', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'Apply unauthorized construction penalty as per Act.'),
    ('FUR-04', 1, 'ACT_PENALTY', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'Apply unauthorized construction penalty as per Act.')
) v (RuleCode, IsPenaltyApplicable, PenaltyMode, PenaltyPercent, PenaltyDateSourceType, PenaltyDateEvidenceCode, PenaltyDateCondition, CompareDate, CompareDateTo, ElseAction, RequiresManualReview, Remarks)
INNER JOIN PTIS.RetrospectiveRuleMaster R
    ON R.RuleCode = v.RuleCode
LEFT JOIN PTIS.EvidenceTypeMaster ET
    ON ET.EvidenceCode = v.PenaltyDateEvidenceCode
WHERE NOT EXISTS
(
    SELECT 1
    FROM PTIS.RetrospectivePenaltyRule t
    WHERE t.RuleId = R.Id
);
GO


------------------------------------------------------------
-- 7. Rule Summary
------------------------------------------------------------
INSERT INTO PTIS.RetrospectiveRuleSummary
(
    RuleId,
    WhenSummary,
    TaxSummary,
    PenaltySummary,
    IsActive,
    CreatedBy
)
SELECT
    R.Id,
    v.WhenSummary,
    v.TaxSummary,
    v.PenaltySummary,
    1,
    1
FROM (VALUES
    ('THA-01', 'OC available; CC, Electricity, Change Detection unavailable', 'Start from OC date; not before 01-Apr-2016; tax x 1.', 'Not applicable because OC or CC is available.'),
    ('THA-02', 'CC available; OC, Electricity, Change Detection unavailable', 'Start from CC date; not before 01-Apr-2016; tax x 1.', 'Not applicable because OC or CC is available.'),
    ('THA-03', 'CC and Electricity available; OC unavailable; Electricity date before CC date', 'Start from CC date; not before 01-Apr-2016; tax x 1.5.', 'Not applicable because OC or CC is available.'),
    ('THA-04', 'CC and Electricity available; OC unavailable; Electricity date after CC date', 'Start from Electricity date; not before 01-Apr-2016; tax x 1.5.', 'Not applicable because OC or CC is available.'),
    ('THA-05', 'Electricity available; OC, CC, Change Detection unavailable; Electricity date before cutoff date', 'Start from fixed cutoff date 01-Apr-2016; tax x 1.', 'Apply penalty as per the Act.'),
    ('THA-06', 'Electricity available; OC, CC, Change Detection unavailable; Electricity date after cutoff date', 'Start from Electricity date; not before 01-Apr-2016; tax x 1.', 'Apply penalty as per the Act.'),
    ('THA-07', 'Change Detection available; OC, CC, Electricity unavailable', 'Start from Change Detection date; not before 01-Apr-2016; tax x 1.', 'Apply penalty as per the Act.'),
    ('THA-08', 'Construction Year available; OC, CC, Electricity, Change Detection unavailable', 'Start from Construction Year/date; not before 01-Apr-2016; tax x 1.', 'Apply penalty as per the Act.'),
    ('THA-09', 'OC and CC available; CC-to-OC gap exceeds 6 months', 'Start from CC date; not before 01-Apr-2016; tax 1.5x from CC date to OC date, then 1x from OC date (day-split within the OC-onset year).', 'Not applicable because OC or CC is available.'),
    ('THA-10', 'OC and CC available; CC-to-OC gap within 6 months', 'Start from OC date; not before 01-Apr-2016; tax x 1.', 'Not applicable because OC or CC is available.'),
    ('PCM-01', 'OC available; OC date older than allowed period', 'Start from rolling six-year boundary; maximum 6 years; tax x 1.', 'Not applicable because OC or CC is available.'),
    ('PCM-02', 'OC available; OC date within allowed period', 'Start from OC date; maximum 6 years; tax x 1.', 'Not applicable because OC or CC is available.'),
    ('PCM-03', 'CC available; OC, Electricity, Change Detection unavailable', 'Start from next financial year after CC date; maximum 6 years; tax x 1.', 'Not applicable because OC or CC is available.'),
    ('PCM-04', 'Electricity available; OC, CC, Change Detection unavailable', 'Start from 1-April of Electricity financial year; maximum 6 years; tax x 1.', 'Apply penalty if Electricity date is on or after 03-Mar-2026; otherwise manual review.'),
    ('PCM-05', 'CC and Electricity available; OC unavailable', 'Start from Electricity date; maximum 6 years; tax x 1.', 'Not applicable because OC or CC is available.'),
    ('PCM-06', 'Construction Year available; OC, CC, Electricity, Change Detection unavailable', 'Start from later of construction date or rolling cap; maximum 6 years; tax x 1.', 'Penalty date source requires manual review because Electricity is unavailable.'),
    ('FUR-01', 'OC available; OC date older than allowed period', 'Start from rolling six-year boundary; maximum 6 years; tax x 1.', 'Not applicable because OC or CC is available.'),
    ('FUR-02', 'OC available; OC date within allowed period', 'Start from OC date; maximum 6 years; tax x 1.', 'Not applicable because OC or CC is available.'),
    ('FUR-03', 'Construction Year available; OC, CC, Electricity, Change Detection unavailable', 'Start from fixed cutoff date 01-Sep-2024; tax x 1.', 'Apply penalty as per the Act.'),
    ('FUR-04', 'Electricity available; OC, CC, Change Detection unavailable; Electricity date after September 2024 cutoff', 'Start six months after Electricity date; not before 01-Sep-2024; tax x 1.', 'Apply penalty as per the Act.')
) v (RuleCode, WhenSummary, TaxSummary, PenaltySummary)
INNER JOIN PTIS.RetrospectiveRuleMaster R
    ON R.RuleCode = v.RuleCode
WHERE NOT EXISTS
(
    SELECT 1
    FROM PTIS.RetrospectiveRuleSummary t
    WHERE t.RuleId = R.Id
);
GO


------------------------------------------------------------
-- 8. Rule Audit Log
------------------------------------------------------------
INSERT INTO PTIS.RetrospectiveRuleAuditLog
(
    RuleId,
    ActionType,
    OldValue,
    NewValue,
    Remarks,
    CreatedBy
)
SELECT
    R.Id,
    'CREATE',
    NULL,
    R.RuleCode,
    'Initial retrospective rule seed data inserted without ULB mapping.',
    1
FROM (VALUES
    ('THA-09'),
    ('THA-10'),
    ('THA-01'),
    ('THA-02'),
    ('THA-03'),
    ('THA-04'),
    ('THA-05'),
    ('THA-06'),
    ('THA-07'),
    ('THA-08'),
    ('PCM-01'),
    ('PCM-02'),
    ('PCM-05'),
    ('PCM-03'),
    ('PCM-04'),
    ('PCM-06'),
    ('FUR-01'),
    ('FUR-02'),
    ('FUR-03'),
    ('FUR-04')
) v (RuleCode)
INNER JOIN PTIS.RetrospectiveRuleMaster R
    ON R.RuleCode = v.RuleCode
WHERE NOT EXISTS
(
    SELECT 1
    FROM PTIS.RetrospectiveRuleAuditLog t
    WHERE t.RuleId = R.Id
      AND t.ActionType = 'CREATE'
);
GO


------------------------------------------------------------
-- 9. Default Tax Policy
------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM PTIS.RetrospectiveTaxPolicy WHERE TaxPolicyCode = 'DEFAULT_RETRO_POLICY')
BEGIN
    DECLARE @IsActive bit = CASE WHEN EXISTS (SELECT 1 FROM PTIS.RetrospectiveTaxPolicy WHERE IsActive = 1) THEN 0 ELSE 1 END;

    INSERT INTO PTIS.RetrospectiveTaxPolicy (TaxPolicyCode, TaxPolicyName, RateMode, PercentageMode, FixedPercentage, FinancialYearStartMonth, FinancialYearStartDay, EffectiveFrom, IsActive, CreatedBy)
    VALUES ('DEFAULT_RETRO_POLICY', 'Default Retrospective Tax Policy', 'CURRENT_YEAR_FOR_ALL_YEARS', 'CURRENT_YEAR_FOR_ALL_YEARS', NULL, 4, 1, '2026-04-01', @IsActive, 1);
END
GO


/* ============================================================================
   Seed: PTIS.PropertyPhotoType
   Purpose:
   Mandatory photo types for society, wing, property and amenity photos.

   Notes:
   - PhotoScope identifies level only (PROPERTY / SOCIETY / WING / AMENITY).
   - BOARD / SIGN_BOARD are PhotoTypeCode values, not PhotoScope values.
   - Same PhotoType can have multiple uploaded photos in PTIS.PropertyPhoto
     (see CK_PropertyPhoto_EntityScope / IX_PropertyPhoto_Entity_Type above:
     EntityType marks the apply level, S/W rows also keep their parent
     SocietyDetailId/WingDetailId hierarchy ids for filtering/reporting).
============================================================================ */

SET NOCOUNT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    /* =========================
       PROPERTY PHOTO TYPES
    ========================= */

    IF NOT EXISTS (
        SELECT 1 FROM [PTIS].[PropertyPhotoType]
        WHERE [PhotoTypeCode] = 'PROPERTY_FRONT'
    )
    BEGIN
        INSERT INTO [PTIS].[PropertyPhotoType]
        (
            [PhotoTypeCode],
            [PhotoTypeName],
            [Description],
            [DisplayOrder],
            [PhotoScope],
            [IsActive],
            [CreatedBy]
        )
        VALUES
        (
            'PROPERTY_FRONT',
            N'Property Front Photo',
            N'Front photo of individual property / flat / shop',
            1,
            'PROPERTY',
            1,
            1
        );
    END

    IF NOT EXISTS (
        SELECT 1 FROM [PTIS].[PropertyPhotoType]
        WHERE [PhotoTypeCode] = 'PROPERTY_SIDE'
    )
    BEGIN
        INSERT INTO [PTIS].[PropertyPhotoType]
        (
            [PhotoTypeCode],
            [PhotoTypeName],
            [Description],
            [DisplayOrder],
            [PhotoScope],
            [IsActive],
            [CreatedBy]
        )
        VALUES
        (
            'PROPERTY_SIDE',
            N'Property Side Photo',
            N'Side photo of individual property / flat / shop',
            2,
            'PROPERTY',
            1,
            1
        );
    END

    IF NOT EXISTS (
        SELECT 1 FROM [PTIS].[PropertyPhotoType]
        WHERE [PhotoTypeCode] = 'PROPERTY_INSIDE'
    )
    BEGIN
        INSERT INTO [PTIS].[PropertyPhotoType]
        (
            [PhotoTypeCode],
            [PhotoTypeName],
            [Description],
            [DisplayOrder],
            [PhotoScope],
            [IsActive],
            [CreatedBy]
        )
        VALUES
        (
            'PROPERTY_INSIDE',
            N'Property Inside Photo',
            N'Inside photo of individual property / flat / shop',
            3,
            'PROPERTY',
            1,
            1
        );
    END

    IF NOT EXISTS (
        SELECT 1 FROM [PTIS].[PropertyPhotoType]
        WHERE [PhotoTypeCode] = 'PROPERTY_BOARD'
    )
    BEGIN
        INSERT INTO [PTIS].[PropertyPhotoType]
        (
            [PhotoTypeCode],
            [PhotoTypeName],
            [Description],
            [DisplayOrder],
            [PhotoScope],
            [IsActive],
            [CreatedBy]
        )
        VALUES
        (
            'PROPERTY_BOARD',
            N'Property Board Photo',
            N'Board / name plate photo of individual property',
            4,
            'PROPERTY',
            1,
            1
        );
    END

    IF NOT EXISTS (
        SELECT 1 FROM [PTIS].[PropertyPhotoType]
        WHERE [PhotoTypeCode] = 'PROPERTY_PLAN'
    )
    BEGIN
        INSERT INTO [PTIS].[PropertyPhotoType]
        (
            [PhotoTypeCode],
            [PhotoTypeName],
            [Description],
            [DisplayOrder],
            [PhotoScope],
            [IsActive],
            [CreatedBy]
        )
        VALUES
        (
            'PROPERTY_PLAN',
            N'Property Plan',
            N'Plan image of individual property / flat / shop',
            5,
            'PROPERTY',
            1,
            1
        );
    END


    /* =========================
       SOCIETY PHOTO TYPES
    ========================= */

    IF NOT EXISTS (
        SELECT 1 FROM [PTIS].[PropertyPhotoType]
        WHERE [PhotoTypeCode] = 'SOCIETY_PLACE'
    )
    BEGIN
        INSERT INTO [PTIS].[PropertyPhotoType]
        (
            [PhotoTypeCode],
            [PhotoTypeName],
            [Description],
            [DisplayOrder],
            [PhotoScope],
            [IsActive],
            [CreatedBy]
        )
        VALUES
        (
            'SOCIETY_PLACE',
            N'Society Place Photo',
            N'Common society place / premises photo',
            10,
            'SOCIETY',
            1,
            1
        );
    END

    IF NOT EXISTS (
        SELECT 1 FROM [PTIS].[PropertyPhotoType]
        WHERE [PhotoTypeCode] = 'SOCIETY_BOARD'
    )
    BEGIN
        INSERT INTO [PTIS].[PropertyPhotoType]
        (
            [PhotoTypeCode],
            [PhotoTypeName],
            [Description],
            [DisplayOrder],
            [PhotoScope],
            [IsActive],
            [CreatedBy]
        )
        VALUES
        (
            'SOCIETY_BOARD',
            N'Society Board Photo',
            N'Society name board photo',
            11,
            'SOCIETY',
            1,
            1
        );
    END

    IF NOT EXISTS (
        SELECT 1 FROM [PTIS].[PropertyPhotoType]
        WHERE [PhotoTypeCode] = 'SOCIETY_SIGN_BOARD'
    )
    BEGIN
        INSERT INTO [PTIS].[PropertyPhotoType]
        (
            [PhotoTypeCode],
            [PhotoTypeName],
            [Description],
            [DisplayOrder],
            [PhotoScope],
            [IsActive],
            [CreatedBy]
        )
        VALUES
        (
            'SOCIETY_SIGN_BOARD',
            N'Society Sign Board Photo',
            N'Society sign board photo',
            12,
            'SOCIETY',
            1,
            1
        );
    END


    /* =========================
       WING PHOTO TYPES
    ========================= */

    IF NOT EXISTS (
        SELECT 1 FROM [PTIS].[PropertyPhotoType]
        WHERE [PhotoTypeCode] = 'WING_BUILDING'
    )
    BEGIN
        INSERT INTO [PTIS].[PropertyPhotoType]
        (
            [PhotoTypeCode],
            [PhotoTypeName],
            [Description],
            [DisplayOrder],
            [PhotoScope],
            [IsActive],
            [CreatedBy]
        )
        VALUES
        (
            'WING_BUILDING',
            N'Wing Building Photo',
            N'Wing building photo',
            20,
            'WING',
            1,
            1
        );
    END

    IF NOT EXISTS (
        SELECT 1 FROM [PTIS].[PropertyPhotoType]
        WHERE [PhotoTypeCode] = 'WING_PLACE'
    )
    BEGIN
        INSERT INTO [PTIS].[PropertyPhotoType]
        (
            [PhotoTypeCode],
            [PhotoTypeName],
            [Description],
            [DisplayOrder],
            [PhotoScope],
            [IsActive],
            [CreatedBy]
        )
        VALUES
        (
            'WING_PLACE',
            N'Wing Place Photo',
            N'Wing common place / premises photo',
            21,
            'WING',
            1,
            1
        );
    END

    IF NOT EXISTS (
        SELECT 1 FROM [PTIS].[PropertyPhotoType]
        WHERE [PhotoTypeCode] = 'WING_BOARD'
    )
    BEGIN
        INSERT INTO [PTIS].[PropertyPhotoType]
        (
            [PhotoTypeCode],
            [PhotoTypeName],
            [Description],
            [DisplayOrder],
            [PhotoScope],
            [IsActive],
            [CreatedBy]
        )
        VALUES
        (
            'WING_BOARD',
            N'Wing Board Photo',
            N'Wing board photo',
            22,
            'WING',
            1,
            1
        );
    END

    IF NOT EXISTS (
        SELECT 1 FROM [PTIS].[PropertyPhotoType]
        WHERE [PhotoTypeCode] = 'WING_SIGN_BOARD'
    )
    BEGIN
        INSERT INTO [PTIS].[PropertyPhotoType]
        (
            [PhotoTypeCode],
            [PhotoTypeName],
            [Description],
            [DisplayOrder],
            [PhotoScope],
            [IsActive],
            [CreatedBy]
        )
        VALUES
        (
            'WING_SIGN_BOARD',
            N'Wing Sign Board Photo',
            N'Wing sign board photo',
            23,
            'WING',
            1,
            1
        );
    END


    /* =========================
       AMENITY PHOTO TYPE
       Final usage pending DBA discussion.
       Required because SocialAttributeMaster has PhotoTypeId FK.
    ========================= */

    IF NOT EXISTS (
        SELECT 1 FROM [PTIS].[PropertyPhotoType]
        WHERE [PhotoTypeCode] = 'AMENITY_PHOTO'
    )
    BEGIN
        INSERT INTO [PTIS].[PropertyPhotoType]
        (
            [PhotoTypeCode],
            [PhotoTypeName],
            [Description],
            [DisplayOrder],
            [PhotoScope],
            [IsActive],
            [CreatedBy]
        )
        VALUES
        (
            'AMENITY_PHOTO',
            N'Amenity Photo',
            N'Photo for amenity / social attribute',
            30,
            'AMENITY',
            1,
            1
        );
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO
