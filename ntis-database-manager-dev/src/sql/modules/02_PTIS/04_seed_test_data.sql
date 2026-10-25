
SET IDENTITY_INSERT [PTIS].[PropertyMast] ON;
GO

INSERT [PTIS].[PropertyMast](
    [Id], [TaxZoneId], [WardId], [PropertyNo], [PartitionNo], [PropertySeqNo],[PropertyTypeId], [UPICId], [OpenPlot], [CSN], [SubZoneNo],[PlotNo], [CategoryId], [Type],  [OwnerTitle],[OwnerName], [OccupierTitle], [OccupierName], [FlatOrShopNo],[FlatOrShopName], [Address], [Location], [MobileNo], [EmailId],[WingDetailId], [OwnerTitleEnglish], [OwnerNameEnglish],[OccupierTitleEnglish], [OccupierNameEnglish],[FlatOrShopNoEnglish], [FlatOrShopNameEnglish],[AddressEnglish], [LocationEnglish], [MarkedForDeletion],[IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate] )
SELECT
    pd.PropertyId,
    tz.Id,
    wm.Id,
    pd.PropertyNo, pd.PartitionNo,
    ROW_NUMBER() OVER (PARTITION BY wm.Id, pd.PropertyNo, pd.PartitionNo ORDER BY pd.PropertyId),
    pd.PropertyTypeId, pd.UPICId, pd.OpenPlot, pd.CSN, pd.SubZoneNo,
    pd.PlotNo, pd.CategoryId, pd.Type,  pd.OwnerTitle,
    pd.OwnerName, pd.OccupierTitle, pd.OccupierName, pd.FlatOrShopNo,
    pd.FlatOrShopName, pd.Address, pd.Location, pd.MobileNo, pd.EmailId,
    pd.WingDetailId, pd.OwnerTitleEnglish, pd.OwnerNameEnglish,
    pd.OccupierTitleEnglish, pd.OccupierNameEnglish,
    pd.FlatOrShopNoEnglish, pd.FlatOrShopNameEnglish,
    pd.AddressEnglish, pd.LocationEnglish, pd.MarkedForDeletion,
    pd.IsActive, pd.CreatedBy, pd.CreatedDate, pd.UpdatedBy, pd.UpdatedDate
FROM (VALUES
    (549357, N'1', N'MM11', N'10', N'', 41, N'MM1100100000', 0, N'45', N'98/440 ', N'', 1, NULL, N'à¤¶à¥à¤°à¥€', N'LODHA AMARA BUILDING', NULL, N'', N'', N'PARKING  13 FLOOR ', N'Lodha Amara Kolshet Road Thane West', N'7, Kolshet Rd, Lodha Amara, Kolshet Industrial Area, Thane West, Mumbai, Thane, Maharashtra 400607, India ', N'', N'', NULL, N'Mr', N'.', NULL, N'', N'', N'', N'', N'7, Kolshet Rd, Lodha Amara, Kolshet Industrial Area, Thane West, Mumbai, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 60, CAST(N'2025-06-28T11:51:10.530' AS DateTime)),

    (549439, N'1', N'MM11', N'15', N'', 12, N'MM1100150000', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'The Holder', N'Smt', N'', N'', N'', N'SAI KRUPA CHAWL VARCHA GAON, KOLSHET, THANE-400607', N'6XQR+6M9, Kolshet Rd, Kolshet, Thane West, Thane, Maharashtra 400607, India ', N'9222122264', N'', NULL, N'', N'The Holder', N'', N'', N'', N'.', N'', N'6XQR+6M9, Kolshet Rd, Kolshet, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-07-30T18:07:14.610' AS DateTime)),

    (549441, N'1', N'MM11', N'16', N'', 12, N'MM1100160000', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'The Holder', N'Smt', N'', N'', N'', N'SAI KRUPA CHAWL VARCHA GAON, KOLSHET, THANE-400607', N'6XQR+6M9, Kolshet Rd, Kolshet, Thane West, Thane, Maharashtra 400607, India ', N'8082028615', N'', NULL, N'', N'The Holder', N'', N'', N'', N'', N'', N'6XQR+6M9, Kolshet Rd, Kolshet, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-07-30T18:28:17.217' AS DateTime)),

   (549442, N'1', N'MM11', N'17', N'', 12, N'MM1100170000', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'The Holder', N'Mr', N'', N'', N'', N'SAI KRUPA CHAWL VARCHA GAON, KOLSHET, THANE-400607', N'6XQR+6M9, Kolshet Rd, Kolshet, Thane West, Thane, Maharashtra 400607, India ', N'7208357449', N'', NULL, N'', N'The Holder', N'', N'', N'', N'.', N'', N'6XQR+6M9, Kolshet Rd, Kolshet, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-07-30T18:33:57.860' AS DateTime)),
 
 (549445, N'1', N'MM11', N'18', N'', 12, N'MM1100180000', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'The Holder', N'Mr', N'', N'', N'', N'SAI KRUPA CHAWL,VARCHA GAON, KOLSHET, THANE-400607', N'6XQR+6M9, Kolshet Rd, Kolshet, Thane West, Thane, Maharashtra 400607, India ', N'9833529588', N'', NULL, N'', N'The Holder', N'', N'', N'', N'', N'', N'6XQR+6M9, Kolshet Rd, Kolshet, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-07-30T18:40:21.360' AS DateTime)),
 
 (549446, N'1', N'MM11', N'19', N'', 12, N'MM1100190000', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'The Holder', N'Mr', N'PRESENT OCCUPIER :- AJAY RAMPAL ROHANDIYA', N'', N'', N'SAI KRUPA CHAWL,VARCHA GAON, KOLSHET, THANE-400607', N'6XQR+6M9, Kolshet Rd, Kolshet, Thane West, Thane, Maharashtra 400607, India ', N'9967768667', N'', NULL, N'', N'The Holder', N'', N'', N'', N'', N'', N'6XQR+6M9, Kolshet Rd, Kolshet, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-08-19T15:12:44.047' AS DateTime)),
 
 (549448, N'1', N'MM11', N'20', N'', 12, N'MM1100200000', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'The Holder', N'Mr', N'', N'', N'', N'SAI KRUPA CHAWL,VARCHA GAON, KOLSHET, THANE-400607', N'1, Gamdevi, Marol, Andheri East, Mumbai, Thane, Maharashtra 400059, India ', N'9004814808', N'', NULL, N'', N'The Holder', N'', N'', N'', N'', N'', N'1, Gamdevi, Marol, Andheri East, Mumbai, Thane, Maharashtra 400059, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 73, CAST(N'2025-08-19T16:58:57.933' AS DateTime)),
 
 (549451, N'1', N'MM11', N'21', N'', 12, N'MM1100210000', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'The Holder', N'Smt', N'', N'', N'', N'SAI KRUPA CHAWL,VARCHA GAON, KOLSHET, THANE-400607', N'1, Gamdevi, Marol, Andheri East, Mumbai, Thane, Maharashtra 400059, India ', N'9322757603', N'', NULL, N'', N'The Holder', N'', N'', N'', N'', N'', N'1, Gamdevi, Marol, Andheri East, Mumbai, Thane, Maharashtra 400059, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-08-19T15:29:45.997' AS DateTime)),
 
 (549452, N'1', N'MM11', N'22', N'', 12, N'MM1100220000', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'The Holder', N'Mr', N'', N'', N'', N'SAI KRUPA CHAWL,VARCHA GAON, KOLSHET, THANE-400607', N'1, Gamdevi, Marol, Andheri East, Mumbai, Thane, Maharashtra 400059, India ', N'7738632925', N'', NULL, N'', N'The Holder', N'', N'', N'', N'', N'', N'1, Gamdevi, Marol, Andheri East, Mumbai, Thane, Maharashtra 400059, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 73, CAST(N'2025-08-14T17:33:14.693' AS DateTime)),
 
 (549453, N'1', N'MM11', N'23', N'', 12, N'MM1100230000', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'The Holder', N'Mr', N'', N'', N'', N'SAI KRUPA CHAWL,VARCHA GAON, KOLSHET, THANE-400607', N'1, Gamdevi, Marol, Andheri East, Mumbai, Thane, Maharashtra 400059, India ', N'9869737593', N'', NULL, N'', N'The Holder', N'', N'', N'', N'', N'', N'1, Gamdevi, Marol, Andheri East, Mumbai, Thane, Maharashtra 400059, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-08-19T15:48:04.117' AS DateTime)),
 
 (550296, N'1', N'MM1', N'19', N'', 5, N'MM0100190000', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'The Holder', N'Mr', N'ABAHY BRIJBIHARI SHARMA & NISTHA ABHAY SHARMA', N'', N'Swasth Sankalpan', N'BUNGLOW NO. 3 OPP. DEV DARSHAN SOC. PHASE1, G.B. ROAD , THANE ,WEST.', N'S-1, Dongripada, Thane West, Thane, Maharashtra 400607, India ', N'9833222706', N'', NULL, N'', N'The Holder', N'', N'', N'', N'Swasth Sankalpan', N'', N'S-1, Dongripada, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (550299, N'1', N'MM1', N'22', N'', 12, N'MM0100220000', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'The Holder', N'Mr', N'SMT.  SHILA VILAS MANIK', N'', N'Alder Care', N'Near Devdarshan Phase 1 Bilding Dongripada Ghodbunder Road. Thane West', N'Dosti Imperia, 7, Ghodbunder Rd, Manpada, Thane West, Thane, Maharashtra 400607, India ', N'8454970354', N'', NULL, N'', N'The Holder', N'', NULL, NULL, N'', N'', N'Dosti Imperia, 7, Ghodbunder Rd, Manpada, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (550300, N'1', N'MM1', N'23', N'', 1, N'MM0100230000', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'The Holder', N'Mr', N'SHRI. AJAY TAMHANE AND SOU. JAYSHREETAMHANE', N'', N'', N'KAVESAR', N'Dosti Imperia, 7, Ghodbunder Rd, Manpada, Thane West, Thane, Maharashtra 400607, India ', N'9930593675', N'', NULL, N'', N'The Holder', N'', NULL, NULL, N'', N'', N'Dosti Imperia, 7, Ghodbunder Rd, Manpada, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (550304, N'1', N'MM1', N'24', N'', 1, N'MM0100240000', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'The Holder', N'Mr', N'SALONA BAINS JOSHI', N'', N'Uc Kindies', N'Near Devdarshan Phase 1 Bilding Dongripada Ghodbunder Road. Thane West', N'Dosti Imperia, 7, Ghodbunder Rd, Manpada, Thane West, Thane, Maharashtra 400607, India ', N'9819156930', N'', NULL, N'', N'The Holder', N'', NULL, NULL, N'', N'', N'Dosti Imperia, 7, Ghodbunder Rd, Manpada, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (550514, N'1', N'MM1', N'41', N'', 29, N'MM0100410000', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'THE HOLDER', N'Mr', N'THE HOLDER', N'', N'Sidhivinayak', N'NEAR HOTEL JALALA GHODBANDAR ROAD . , THANE-400607', N'Vijay Galaxy Vijay Galaxy-1, 1, Wagbil Rd, Anu Nagar, Vijay Nagari, Thane West, Thane, Maharashtra 400607, India ', N'9987631663', N'', NULL, N'', N'', N'', N'Dilip Radheshyam Chaubey', NULL, N'', N'', N'Vijay Galaxy Vijay Galaxy-1, 1, Wagbil Rd, Anu Nagar, Vijay Nagari, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (550516, N'1', N'MM1', N'42', N'', 12, N'MM0100420000', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'The Holder', N'Mr', NULL, NULL, N'Stayl Your Spase', N' GALA NO.4, RADHESHYAM CHAWL, WAGHBIL NAKA, NR. DALAL COMPANY, G.B. ROAD, THANE', N'7X3F+73M, Wagbil Rd, Anu Nagar, Vijay Nagari, Thane West, Thane, Maharashtra 400607, India ', N'8828177466', N'', NULL, N'', N'The Holder', N'', NULL, NULL, N'', N'', N'7X3F+73M, Wagbil Rd, Anu Nagar, Vijay Nagari, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (550722, N'1', N'MM1', N'85', N'', 12, N'MM0100850000', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'- KALLU SURAJ GAUD KALLU SURAJ GAUD ', N'', N'', N'', N'', N'Near SANGHAVI HILLS .D MART  ANAND NAGER G B ROAD THANE WEST', N'1, Ghodbunder Rd, Sanghavi Hills, Parkwoods, Thane West, Mumbai, Maharashtra 400607, India ', N'7738869965', N'', NULL, N'', N'', N'', N'', N'', N'', N'', N'1, Ghodbunder Rd, Sanghavi Hills, Parkwoods, Thane West, Mumbai, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-08-19T12:01:03.007' AS DateTime)),
 
 (550726, N'1', N'MM1', N'85', N'1', 12, N'MM0100850001', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'The Holder', N'Mr', N'The Holder', N'', N'', N'Near SANGHAVI HILLS .D MART ANAND NAGER G B ROAD THANE WEST', NULL, N'', N'', NULL, N'', N'The Holder', NULL, N'', N'', N'', N'', NULL, 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-08-19T12:13:12.973' AS DateTime)),
 
 (550727, N'1', N'MM1', N'85', N'2', 12, N'MM0100850002', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'The Holder', N'Mr', N'The Holder ', N'', N'', N'Near SANGHAVI HILLS .D MART  ANAND NAGER G B ROAD THANE WEST', NULL, N'', N'', NULL, N'', N'The Holder', NULL, N'', N'', N'', N'', NULL, 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-08-19T12:31:28.133' AS DateTime)),
 
 (550728, N'1', N'MM1', N'85', N'3', 12, N'MM0100850003', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'The Holder', N'Mr', N'The Holder', N'', N'', N'Near SANGHAVI HILLS .D MART ANAND NAGER G B ROAD THANE WEST', NULL, N'', N'', NULL, N'', N'The Holder', NULL, N'', N'', N'', N'', NULL, 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-08-19T12:31:50.063' AS DateTime)),
 
 (552371, N'1', N'DIMAJOR1', N'1', N'', 69, NULL, 0, N'', NULL, N'', 1, NULL, N'Mr', N'NAGNATH APARTMENT', N'', N'THE HOLDER', N'', N'.', N'NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', N'', N'', NULL, N'', N'.', N'', N'', N'', N'.', N'', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 60, CAST(N'2025-06-26T12:55:31.150' AS DateTime)),
 
 (552372, N'1', N'DIMAJOR1', N'1', N'A', 69, NULL, 0, N'', NULL, N'', 1, NULL, N'à¤¶à¥à¤°à¥€', N'NAGNATH APARTMENT', NULL, N'THE HOLDER', N'', N'.', N'WING -B, NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', N'', N'', NULL, N'Mr', N'.', NULL, N'', N'', N'', N'', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 60, CAST(N'2025-06-26T12:58:39.177' AS DateTime)),
 
 (552373, N'1', N'DIMAJOR1', N'1', N'S', 69, NULL, 0, N'', NULL, N'', 1, NULL, N'', N'NAGNATH APARTMENT', NULL, N'THE HOLDER', N'', N'.', N'WING -S, NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', N'', N'', NULL, N'', N'', NULL, N'', N'', N'', N'', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 60, CAST(N'2025-06-26T12:58:05.040' AS DateTime)),
 
 (552374, N'1', N'DIMAJOR1', N'1', N'A1', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'NAGNATH APARTMENT', N'', N'THE HOLDER', N'1', N'', N'WING-B, FLAT NO-1, NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', N'9004564479', N'', NULL, N'', N'The Holder', NULL, N'', N'1', N'', N'Wing-B, Flat No-1, NAGNATH APARTMENT MASOBA devnagar Madhavi Bangla Road EKVIRA APARTMENT NEAR', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 55, CAST(N'2025-06-14T15:42:57.910' AS DateTime)),
 
 (552375, N'1', N'DIMAJOR1', N'1', N'A2', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'NAGNATH APARTMENT', N'Mr', N'THE HOLDER', N'101', N'', N'WING-B, FLAT NO-101, NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', N'9819482978', N'', NULL, N'', N'The Holder', NULL, N'', N'101', N'', N'Wing-B, Flat No-101, NAGNATH APARTMENT MASOBA devnagar Madhavi Bangla Road EKVIRA APARTMENT NEAR', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (552376, N'1', N'DIMAJOR1', N'1', N'A3', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'NAGNATH APARTMENT', N'Mr', N'THE HOLDER', N'201', N'', N'WING-B, FLAT NO-201, NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', N'8975378988', N'', NULL, N'', N'The Holder', NULL, N'', N'201', N'', N'Wing-B, Flat No-201, NAGNATH APARTMENT MASOBA devnagar Madhavi Bangla Road EKVIRA APARTMENT NEAR', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (552377, N'1', N'DIMAJOR1', N'1', N'A4', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'NAGNATH APARTMENT', N'Mr', N'THE HOLDER', N'301', N'', N'WING-B, FLAT NO-301, NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', N'8652579778', N'', NULL, N'', N'The Holder', NULL, N'', N'301', N'', N'Wing-B, Flat No-301, NAGNATH APARTMENT MASOBA devnagar Madhavi Bangla Road EKVIRA APARTMENT NEAR', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (552378, N'1', N'DIMAJOR1', N'1', N'A5', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'NAGNATH APARTMENT', N'Mr', N'THE HOLDER', N'401', N'', N'WING-B, FLAT NO-401, NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', N'7977590750', N'', NULL, N'', N'The Holder', NULL, N'', N'401', N'', N'Wing-B, Flat No-401, NAGNATH APARTMENT MASOBA devnagar Madhavi Bangla Road EKVIRA APARTMENT NEAR', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (552379, N'1', N'DIMAJOR1', N'1', N'A6', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'NAGNATH APARTMENT', N'Mr', N'THE HOLDER', N'2', N'', N'WING-B, FLAT NO-2, NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', N'9321443608', N'', NULL, N'', N'The Holder', NULL, N'', N'2', N'', N'WING-B, FLAT NO-2, NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (552380, N'1', N'DIMAJOR1', N'1', N'A7', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'NAGNATH APARTMENT', N'Mr', N'THE HOLDER', N'102', N'', N'WING-B, FLAT NO-102, NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', N'9769270391', N'', NULL, N'', N'The Holder', NULL, N'', N'102', N'', N'Wing-B, Flat No-102, NAGNATH APARTMENT MASOBA devnagar Madhavi Bangla Road EKVIRA APARTMENT NEAR', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (552994, N'1', N'DIMAJOR2', N'1', N'', 69, NULL, 0, N'', NULL, N'', 1, NULL, N'Mr', N'SUKHIYA APARTMENT', N'', N'THE HOLDER', N'', N'.', N'SUKHIYA APARTMENT,KALYAN PHATA DAIGHAR GAON ROAD BESIDE PG,SHIL-421204', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', N'9821201794', N'', NULL, N'', N'.', N'', N'', N'', N'.', N'', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-06-05T18:00:58.173' AS DateTime)),
 
 (553033, N'1', N'DIMAJOR2', N'1', N'A', 12, NULL, 0, N'', NULL, N'', 1, NULL, NULL, N'SUKHIYA APARTMENT', NULL, N'THE HOLDER', NULL, NULL, N'WING -A, SUKHIYA APARTMENT,KALYAN PHATA DAIGHAR GAON ROAD BESIDE PG,SHIL-421204', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', N'9821201794', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, N'Wing -A, Sukhiya Apartment,Kalyan Phata Daighar Gaon Road Beside Pg,Shil', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (553034, N'1', N'DIMAJOR2', N'1', N'S', 13, NULL, 0, N'', NULL, N'', 1, NULL, N'à¤¶à¥à¤°à¥€', N'SUKHIYA APARTMENT', NULL, N'THE HOLDER', N'', N'.', N'WING -S, SUKHIYA APARTMENT,KALYAN PHATA DAIGHAR GAON ROAD BESIDE PG,SHIL-421204', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', N'9821201794', N'', NULL, N'Mr', N'.', NULL, N'', N'', N'', N'Wing -S, Sukhiya Apartment,Kalyan Phata Daighar Gaon Road Beside Pg,Shil', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 70, CAST(N'2025-09-12T16:34:09.020' AS DateTime)),
 
 (553035, N'1', N'DIMAJOR2', N'1', N'A1', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'SUKHIYA APARTMENT', N'Mr', N'THE HOLDER', N'1', N'', N'WING-A, FLAT NO-1, SUKHIYA APARTMENT,KALYAN PHATA DAIGHAR GAON ROAD BESIDE PG,SHIL-421204', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', N'9224555542', N'', NULL, N'', N'The Holder', NULL, N'', N'1', N'', N'Wing-A, Flat No-1, Sukhiya Apartment,Kalyan Phata Daighar Gaon Road Beside Pg,Shil', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 90, CAST(N'2025-07-07T12:27:56.023' AS DateTime)),
 
 (553036, N'1', N'DIMAJOR2', N'1', N'A2', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'', N'SUKHIYA APARTMENT', NULL, N'THE HOLDER', N'101', N'', N'WING-A, FLAT NO-101, SUKHIYA APARTMENT,KALYAN PHATA DAIGHAR GAON ROAD BESIDE PG,SHIL-421204', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', N'8355971319', N'', NULL, N'', N'The Holder', NULL, N'', N'101', N'', N'Wing-A, Flat No-101, Sukhiya Apartment,Kalyan Phata Daighar Gaon Road Beside Pg,Shil', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-06-12T16:10:18.877' AS DateTime)),
 
 (553037, N'1', N'DIMAJOR2', N'1', N'A3', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, NULL, N'SUKHIYA APARTMENT', NULL, N'THE HOLDER', N'201', NULL, N'WING-A, FLAT NO-201, SUKHIYA APARTMENT,KALYAN PHATA DAIGHAR GAON ROAD BESIDE PG,SHIL-421204', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', N'9833116002', NULL, NULL, NULL, N'The Holder', NULL, NULL, N'201', NULL, N'Wing-A, Flat No-201, Sukhiya Apartment,Kalyan Phata Daighar Gaon Road Beside Pg,Shil', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (553038, N'1', N'DIMAJOR2', N'1', N'A4', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, NULL, N'SUKHIYA APARTMENT', NULL, N'THE HOLDER', N'301', NULL, N'WING-A, FLAT NO-301, SUKHIYA APARTMENT,KALYAN PHATA DAIGHAR GAON ROAD BESIDE PG,SHIL-421204', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', N'9821201794', NULL, NULL, NULL, N'The Holder', NULL, NULL, N'301', NULL, N'Wing-A, Flat No-301, Sukhiya Apartment,Kalyan Phata Daighar Gaon Road Beside Pg,Shil', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (553039, N'1', N'DIMAJOR2', N'1', N'A5', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, NULL, N'SUKHIYA APARTMENT', NULL, N'THE HOLDER', N'401', NULL, N'WING-A, FLAT NO-401, SUKHIYA APARTMENT,KALYAN PHATA DAIGHAR GAON ROAD BESIDE PG,SHIL-421204', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', N'9892039450', NULL, NULL, NULL, N'The Holder', NULL, NULL, N'401', NULL, N'Wing-A, Flat No-401, Sukhiya Apartment,Kalyan Phata Daighar Gaon Road Beside Pg,Shil', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (553040, N'1', N'DIMAJOR2', N'1', N'A6', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, NULL, N'SUKHIYA APARTMENT', NULL, N'THE HOLDER', N'501', NULL, N'WING-A, FLAT NO-501, SUKHIYA APARTMENT,KALYAN PHATA DAIGHAR GAON ROAD BESIDE PG,SHIL-421204', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', N'9821201794', NULL, NULL, NULL, N'The Holder', NULL, NULL, N'501', NULL, N'Wing-A, Flat No-501, Sukhiya Apartment,Kalyan Phata Daighar Gaon Road Beside Pg,Shil', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (553041, N'1', N'DIMAJOR2', N'1', N'A7', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'', N'SUKHIYA APARTMENT', NULL, N'THE HOLDER', N'2', N'', N'WING-A, FLAT NO-2, SUKHIYA APARTMENT,KALYAN PHATA DAIGHAR GAON ROAD BESIDE PG,SHIL-421204', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', N'9821201794', N'', NULL, N'', N'The Holder', NULL, N'', N'2', N'', N'Wing-A, Flat No-2, Sukhiya Apartment,Kalyan Phata Daighar Gaon Road Beside Pg,Shil', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-06-12T16:06:18.700' AS DateTime)),
 
 (556004, N'1', N'KLMAJOR3', N'1', N'', 69, NULL, 0, N'', NULL, N'', 1, NULL, N'à¤¶à¥à¤°à¥€', N'PRADIP DATTATRAY KINI AND HANUMAN RAMCHANDRA KINI', N'', N'', N'', N'.', N'MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,KHAREGAON-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', N'', N'', NULL, N'Mr', N'.', N'', N'', N'', N'.', N'', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 55, CAST(N'2025-07-21T20:24:38.123' AS DateTime)),
 
 (556008, N'1', N'KLMAJOR3', N'1', N'A', 69, NULL, 0, N'', NULL, N'', 1, NULL, N'à¤¶à¥à¤°à¥€', N'PRADIP DATTATRAY KINI AND HANUMAN RAMCHANDRA KINI', NULL, N'', N'', N'.', N'Wing -A, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK , Kharegaon-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', N'', N'', NULL, N'Mr', N'.', NULL, N'', N'', N'', N'Wing -A, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,à¤–à¤¾à¤°à¥‡à¤—à¤¾à¤µ-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 69, CAST(N'2025-07-23T18:04:54.223' AS DateTime)),
 
 (556010, N'1', N'KLMAJOR3', N'1', N'A1', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'PRADIP DATTATRAY KINI AND HANUMAN RAMCHANDRA KINI', N'', N'MANDAR CONSTRUCTION AND DEVLOPERS .LLP', N'101', N'', N'Wing-A, Flat No-101, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,Kharegaon-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', N'9833187777', N'mandarkeni@yahoo.com', NULL, N'', N'.', NULL, N'', N'101', N'', N'Wing-A, Flat No-101, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,à¤–à¤¾à¤°à¥‡à¤—à¤¾à¤µ-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-08-08T13:13:55.817' AS DateTime)),
 
 (556011, N'1', N'KLMAJOR3', N'1', N'A2', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'PRADIP DATTATRAY KINI AND HANUMAN RAMCHANDRA KINI', N'', N'MANDAR CONSTRUCTION AND DEVLOPERS .LLP', N'201', N'', N'Wing-A, Flat No-201, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,Kharegaon-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', N'9833187777', N'mandarkeni@yahoo.com', NULL, N'', N'.', NULL, N'', N'201', N'', N'Wing-A, Flat No-201, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,à¤–à¤¾à¤°à¥‡à¤—à¤¾à¤µ-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (556012, N'1', N'KLMAJOR3', N'1', N'A3', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'PRADIP DATTATRAY KINI AND HANUMAN RAMCHANDRA KINI', N'', N'MANDAR CONSTRUCTION AND DEVLOPERS .LLP', N'301', N'', N'Wing-A, Flat No-301, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,Kharegaon-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', N'9833187777', N'mandarkeni@yahoo.com', NULL, N'', N'.', NULL, N'', N'301', N'', N'Wing-A, Flat No-301, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,à¤–à¤¾à¤°à¥‡à¤—à¤¾à¤µ-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 (556013, N'1', N'KLMAJOR3', N'1', N'A4', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'PRADIP DATTATRAY KINI AND HANUMAN RAMCHANDRA KINI', N'', N'MANDAR CONSTRUCTION AND DEVLOPERS .LLP', N'401', N'', N'Wing-A, Flat No-401, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,Kharegaon-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', N'9833187777', N'mandarkeni@yahoo.com', NULL, N'', N'.', NULL, N'', N'401', N'', N'Wing-A, Flat No-401, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,à¤–à¤¾à¤°à¥‡à¤—à¤¾à¤µ-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 55, CAST(N'2025-07-03T20:30:13.697' AS DateTime)),
 
 (556014, N'1', N'KLMAJOR3', N'1', N'A5', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'PRADIP DATTATRAY KINI AND HANUMAN RAMCHANDRA KINI', N'', N'MANDAR CONSTRUCTION AND DEVLOPERS .LLP', N'501', N'', N'Wing-A, Flat No-501, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,Kharegaon-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', N'9833187777', N'mandarkeni@yahoo.com', NULL, N'', N'.', NULL, N'', N'501', N'', N'Wing-A, Flat No-501, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,à¤–à¤¾à¤°à¥‡à¤—à¤¾à¤µ-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (556015, N'1', N'KLMAJOR3', N'1', N'A6', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'PRADIP DATTATRAY KINI AND HANUMAN RAMCHANDRA KINI', N'Mr', N'MANDAR CONSTRUCTION AND DEVLOPERS .LLP', N'601', N'', N'Wing-A, Flat No-601, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,Kharegaon-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', N'9833187777', N'mandarkeni@yahoo.com', NULL, N'', N'.', NULL, N'', N'601', N'', N'Wing-A, Flat No-601, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,à¤–à¤¾à¤°à¥‡à¤—à¤¾à¤µ-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (556016, N'1', N'KLMAJOR3', N'1', N'A7', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'PRADIP DATTATRAY KINI AND HANUMAN RAMCHANDRA KINI', N'', N'MANDAR CONSTRUCTION AND DEVLOPERS .LLP', N'701', N'', N'Wing-A, Flat No-701, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,Kharegaon-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', N'9833187777', N'mandarkeni@yahoo.com', NULL, N'', N'.', NULL, N'', N'701', N'', N'Wing-A, Flat No-701, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,à¤–à¤¾à¤°à¥‡à¤—à¤¾à¤µ-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (556017, N'1', N'KLMAJOR3', N'1', N'A8', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'PRADIP DATTATRAY KINI AND HANUMAN RAMCHANDRA KINI', N'', N'MANDAR CONSTRUCTION AND DEVLOPERS .LLP', N'801', N'', N'Wing-A, Flat No-801, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,Kharegaon-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', N'9833187777', N'mandarkeni@yahoo.com', NULL, N'', N'.', NULL, N'', N'801', N'', N'Wing-A, Flat No-801, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,à¤–à¤¾à¤°à¥‡à¤—à¤¾à¤µ-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (560660, N'1', N'KLMAJOR1', N'3', N'A1', 12, NULL, 0, NULL, NULL, NULL, 1, NULL, NULL, N'The Holder', NULL, NULL, N'101', NULL, N'Flat No-101, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'101', NULL, N'Flat No-101, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (560661, N'1', N'KLMAJOR1', N'3', N'A2', 12, NULL, 0, NULL, NULL, NULL, 1, NULL, NULL, N'The Holder', NULL, NULL, N'201', NULL, N'Flat No-201, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'201', NULL, N'Flat No-201, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (560662, N'1', N'KLMAJOR1', N'3', N'A3', 12, NULL, 0, NULL, NULL, NULL, 1, NULL, NULL, N'The Holder', NULL, NULL, N'301', NULL, N'Flat No-301, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'301', NULL, N'Flat No-301, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (560663, N'1', N'KLMAJOR1', N'3', N'A4', 12, NULL, 0, NULL, NULL, NULL, 1, NULL, NULL, N'The Holder', NULL, NULL, N'401', NULL, N'Flat No-401, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'401', NULL, N'Flat No-401, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (560664, N'1', N'KLMAJOR1', N'3', N'A5', 12, NULL, 0, NULL, NULL, NULL, 1, NULL, NULL, N'The Holder', NULL, NULL, N'501', NULL, N'Flat No-501, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'501', NULL, N'Flat No-501, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (560665, N'1', N'KLMAJOR1', N'3', N'A6', 12, NULL, 0, NULL, NULL, NULL, 1, NULL, NULL, N'The Holder', NULL, NULL, N'601', NULL, N'Flat No-601, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'601', NULL, N'Flat No-601, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (560666, N'1', N'KLMAJOR1', N'3', N'A7', 12, NULL, 0, NULL, NULL, NULL, 1, NULL, NULL, N'The Holder', NULL, NULL, N'701', NULL, N'Flat No-701, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'701', NULL, N'Flat No-701, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (560667, N'1', N'KLMAJOR1', N'3', N'A8', 12, NULL, 0, NULL, NULL, NULL, 1, NULL, NULL, N'The Holder', NULL, NULL, N'102', NULL, N'Flat No-102, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'102', NULL, N'Flat No-102, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (560668, N'1', N'KLMAJOR1', N'3', N'A9', 12, NULL, 0, NULL, NULL, NULL, 1, NULL, NULL, N'The Holder', NULL, NULL, N'202', NULL, N'Flat No-202, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'202', NULL, N'Flat No-202, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (560669, N'1', N'KLMAJOR1', N'3', N'A10', 12, NULL, 0, NULL, NULL, NULL, 1, NULL, NULL, N'The Holder', NULL, NULL, N'302', NULL, N'Flat No-302, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'302', NULL, N'Flat No-302, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (576936, N'1', N'KLMAJOR2', N'1', N'', 69, NULL, 0, N'', NULL, N'', 1, NULL, N'à¤¶à¥à¤°à¥€', N'SHREE HARI HIGHTS', N'', N'THE HOLDER', N'', N'.', N'SHREE HARI HIGHTS, OPPOSITE AMRUT PARK SOCIETY, SHSHTRI NAGAR, KALWA(W).-400605', N'5XXQ+HG7, Shastri Nagar, Manisha Nagar, Kalwa, Thane, Maharashtra 400605, India ', N'9892805400', N'', NULL, N'Mr', N'.', N'', N'', N'', N'', N'', N'5XXQ+HG7, Shastri Nagar, Manisha Nagar, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 75, CAST(N'2025-07-14T17:36:05.770' AS DateTime)),
 
 (576939, N'1', N'KLMAJOR2', N'2', N'', 69, NULL, 0, N'', NULL, N'', 1, NULL, N'à¤¶à¥à¤°à¥€', N'SAWALARAM HEIGHTS WING A&B', N'', N'THE HOLDER', N'', N'.', N'SAWALARAM HEIGHTS,MANISHA NAGAR RD, SHASTRI NAGAR, KALWA,THANE-400605', NULL, N'9867146697', N'', NULL, N'Mr', N'.', N'', N'', N'', N'.', N'', NULL, 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 74, CAST(N'2025-07-12T11:05:38.767' AS DateTime)),
 
 (577185, N'1', N'KLMAJOR2', N'3', N'', 69, NULL, 0, N'', NULL, N'', 1, NULL, N'Mr', N'SALUBAI NIWAS', N'', N'THE HOLDER', N'', N'.', N'SALUBAI NIWAS, JAMA MASJIT ROAD, KALWA NAKA, KALWA (P)THANE.-400605', N'Bala Mhatre Building, Kalwa West, Budhaji Nagar, Kalwa, Thane, Maharashtra 400605, India ', N'9819824232', N'', NULL, N'', N'', N'', N'', N'', N'', N'', N'Bala Mhatre Building, Kalwa West, Budhaji Nagar, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 78, CAST(N'2025-07-09T17:09:15.410' AS DateTime)),
 
 (577437, N'1', N'KLMAJOR2', N'4', N'', 69, NULL, 0, N'', NULL, N'', 1, NULL, N'Mr', N'GANESH KRUPA CO. OP. HOUSING SOCIETY', N'', N'THE HOLDER', N'', N'.', N'GANESH KRUPA, THAKUR CHAUK, MUMBAI-PUNE ROAD, KALWA, THANE-400605', N'401 Dhanalaxmi CHS, Kalwa - Kharigaon Road, Kumbhar Aali, Kalwa West, Budhaji Nagar, Kalwa, Thane, Maharashtra 400605, India ', N'7738709030', N'', NULL, N'', N'', N'', N'', N'', N'.', N'', N'401 Dhanalaxmi CHS, Kalwa - Kharigaon Road, Kumbhar Aali, Kalwa West, Budhaji Nagar, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 77, CAST(N'2025-07-15T17:12:14.963' AS DateTime)),
 
 (577538, N'1', N'KLMAJOR2', N'5', N'', 69, NULL, 0, N'', NULL, N'', 1, NULL, N'Mr', N'PARVATI VILLA', N'', N'THE HOLDER', N'', N'.', N'PARVATI VILLA BUILDING, NEAR PRINCE ELECTRONICS, KUMBHAR ALI, KALWA, THANE-400605', N'9, Station Rd, Kalwa West, Budhaji Nagar, Thane East, Mumbai, Thane, Maharashtra 400605, India ', N'9833123321', N'', NULL, N'', N'', N'', N'', N'', N'', N'', N'9, Station Rd, Kalwa West, Budhaji Nagar, Thane East, Mumbai, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 75, CAST(N'2025-07-14T17:35:03.773' AS DateTime)),
 
 (577957, N'1', N'KLMAJOR2', N'7', N'', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'Smt', N'The Holder', N'Smt', N'Sunita Ramnath Tandel', N'', N'Riddhesh Bunglow', N'Riddhesh Bunglow,Near Prince Electronics, KumbhaAli, Kalwa West,Thane.', N'5XWR+93F, Kumbhar Ln, Sudama Nagar, Budhaji Nagar, Kalwa, Thane, Maharashtra 400605, India ', N'9967488844', N'', NULL, N'', N'', N'', N'', N'', N'Riddhesh Bunglow', N'', N'5XWR+93F, Kumbhar Ln, Sudama Nagar, Budhaji Nagar, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 94, CAST(N'2025-09-04T10:19:52.800' AS DateTime)),
 
 (579097, N'1', N'KLMAJOR2', N'1', N'A', 69, NULL, 0, N'', NULL, N'', 1, NULL, NULL, N'SHREE HARI HIGHTS', NULL, N'THE HOLDER', NULL, NULL, N'WING -A, SHREE HARI HIGHTS, OPPOSITE AMRUT PARK SOCIETY, SHSHTRI NAGAR, KALWA(W).-400605', N'5XXQ+HG7, Shastri Nagar, Manisha Nagar, Kalwa, Thane, Maharashtra 400605, India ', NULL, N'', NULL, NULL, NULL, NULL, NULL, NULL, NULL, N'', N'5XXQ+HG7, Shastri Nagar, Manisha Nagar, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (579098, N'1', N'KLMAJOR2', N'1', N'S', 13, NULL, 0, N'', NULL, N'', 1, NULL, N'à¤¶à¥à¤°à¥€', N'SHREE HARI HIGHTS', NULL, N'THE HOLDER', N'', N'.', N'WING -S, SHREE HARI HIGHTS, OPPOSITE AMRUT PARK SOCIETY, SHSHTRI NAGAR, KALWA(W).-400605', N'5XXQ+HG7, Shastri Nagar, Manisha Nagar, Kalwa, Thane, Maharashtra 400605, India ', N'', N'', NULL, N'Mr', N'.', NULL, N'', N'', N'', N'', N'5XXQ+HG7, Shastri Nagar, Manisha Nagar, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 70, CAST(N'2025-09-03T13:26:25.643' AS DateTime)),
 
 (579099, N'1', N'KLMAJOR2', N'1', N'A1', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'', N'SHRI HARI HIGHTS', NULL, N'THE HOLDER', N'1', N'', N'WING-A, FLAT NO-1, SHREE HARI HIGHTS, OPPOSITE AMRUT PARK SOCIETY, SHSHTRI NAGAR, KALWA(W).-400605', N'5XXQ+HG7, Shastri Nagar, Manisha Nagar, Kalwa, Thane, Maharashtra 400605, India ', N'9867284101', N'', NULL, N'', N'The Holder', NULL, N'', N'1', N'', N'Wing-A, Flat No-1, Shree Hari Hights, Opposite Amrut Park Society, Shshtri Nagar, Kalwa(W).', N'5XXQ+HG7, Shastri Nagar, Manisha Nagar, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 65, CAST(N'2025-07-01T12:52:29.307' AS DateTime)),
 
 (579100, N'1', N'KLMAJOR2', N'1', N'A2', 12, NULL, 0, N'45', N'98/440 ', N'', 1, NULL, N'', N'SHRI HARI HIGHTS', NULL, N'THE HOLDER', N'101', N'', N'WING-A, FLAT NO-101, SHREE HARI HIGHTS, OPPOSITE AMRUT PARK SOCIETY, SHSHTRI NAGAR, KALWA(W).-400605', N'5XXQ+HG7, Shastri Nagar, Manisha Nagar, Kalwa, Thane, Maharashtra 400605, India ', N'8828309595', N'', NULL, N'', N'The Holder', NULL, N'', N'101', N'', N'Wing-A, Flat No-101, Shree Hari Hights, Opposite Amrut Park Society, Shshtri Nagar, Kalwa(W).', N'5XXQ+HG7, Shastri Nagar, Manisha Nagar, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 65, CAST(N'2025-07-01T13:01:02.627' AS DateTime)),
 
 (599038, N'1', N'MM13', N'1', N'', 152, N'MM1300010000', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'The Holder', N'Mr', N'GROVERS PVT.LTD.', N'', N'', N'Near 3 Manorama Nagar Kolshet Road Thane West', N'3, Manorma Nagar Rd, Sambhaji Nagar, Manorama Nagar, Thane West, Mumbai, Thane, Maharashtra 400607, India ', N'9820127610', N'', NULL, N'', N'The Holder', N'', N'', N'', N'', N'', N'3, Manorma Nagar Rd, Sambhaji Nagar, Manorama Nagar, Thane West, Mumbai, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (602675, N'1', N'MM13', N'15', N'', 82, N'MM1300150000', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'The Holder', N'Mr', N'MR. BHAVESH PRAVIN DAGHA / MR. VIRAL LAKHAMSHI CHHEDA / MR. LEERA PARBAT BANGARI', N'', N'Eye Care Optics ,mix And Mach,career point Cota', N'HOUSE NO 51 NR DEV PUJA KOLSHET ROAD BALKUM DHOKALI', N'6XHJ+5FX, Kolshet Rd, Opposite Silverline, Shree Swamikrupa Phase 2, New Ganesh Nagar, Dhokali, Thane West, Thane, Maharashtra 400607, India ', N'9820165906', N'', NULL, N'', N'The Holder', N'', N'', N'', N'Eye Care Optics ,mix And Mach,career point Cota', N'', N'6XHJ+5FX, Kolshet Rd, Opposite Silverline, Shree Swamikrupa Phase 2, New Ganesh Nagar, Dhokali, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (602680, N'1', N'MM13', N'16', N'', 92, N'MM1300160000', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'The Holder', N'Mr', N'M/S.  S. D. PAINTS', N'', N'ESDEE PAINTS LTD', N'HOUSE NO 52 NR SUBHASH SARAP KOLSHET ROAD BALKUM DHOKALI', N'Kavyaduara Residential Complex, Kolshet Rd, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', N'9372759045', N'', NULL, N'', N'The Holder', N'', N'', N'', N'ESDEE PAINTS LTD', N'', N'Kavyaduara Residential Complex, Kolshet Rd, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 57, CAST(N'2025-10-03T17:19:32.833' AS DateTime)),
 
 (604230, N'1', N'MM13', N'20', N'A', 12, N'MM130020000A', 0, N'', NULL, N'', 1, NULL, NULL, N'Riviera', NULL, NULL, NULL, NULL, N'Wing -RIVIERA A, Dhokali Manorama Nagar Kolshet Road Thane West', N'5, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Manpada, Thane, Maharashtra 400607, India ', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, N'Wing -RIVIERA A, Dhokali Manorama Nagar Kolshet Road Thane West', N'5, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Manpada, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (604231, N'1', N'MM13', N'20', N'B', 12, N'MM130020000B', 0, N'', NULL, N'', 1, NULL, NULL, N'Riviera', NULL, NULL, NULL, NULL, N'Wing -B, Dhokali Manorama Nagar Kolshet Road Thane West', N'5, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Manpada, Thane, Maharashtra 400607, India ', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, N'Wing -B, Dhokali Manorama Nagar Kolshet Road Thane West', N'5, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Manpada, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (604264, N'1', N'MM13', N'31', N'A1', 12, N'MM13003100A1', 0, NULL, NULL, NULL, 1, NULL, NULL, N'The Holder', NULL, N'', N'101', NULL, N'Wing-A, Flat No-101, Dhokali Manorama Nagar Kolshet Road Thane West', N'189, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', N'9869534650', NULL, NULL, NULL, N'The Holder', NULL, NULL, N'101', NULL, N'Wing-A, Flat No-101, Dhokali Manorama Nagar Kolshet Road Thane West', N'189, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (604265, N'1', N'MM13', N'31', N'A2', 12, N'MM13003100A2', 0, NULL, NULL, NULL, 1, NULL, NULL, N'The Holder', NULL, N'', N'201', NULL, N'Wing-A, Flat No-201, Dhokali Manorama Nagar Kolshet Road Thane West', N'189, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, N'', N'201', NULL, N'Wing-A, Flat No-201, Dhokali Manorama Nagar Kolshet Road Thane West', N'189, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (604266, N'1', N'MM13', N'31', N'A3', 12, N'MM13003100A3', 0, NULL, NULL, NULL, 1, NULL, NULL, N'The Holder', NULL, N'', N'301', NULL, N'Wing-A, Flat No-301, Dhokali Manorama Nagar Kolshet Road Thane West', N'189, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, N'', N'301', NULL, N'Wing-A, Flat No-301, Dhokali Manorama Nagar Kolshet Road Thane West', N'189, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (604267, N'1', N'MM13', N'31', N'A4', 12, N'MM13003100A4', 0, NULL, NULL, NULL, 1, NULL, NULL, N'The Holder', NULL, N'', N'401', NULL, N'Wing-A, Flat No-401, Dhokali Manorama Nagar Kolshet Road Thane West', N'189, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, N'', N'401', NULL, N'Wing-A, Flat No-401, Dhokali Manorama Nagar Kolshet Road Thane West', N'189, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (604268, N'1', N'MM13', N'31', N'A5', 12, N'MM13003100A5', 0, NULL, NULL, NULL, 1, NULL, NULL, N'The Holder', NULL, N'', N'501', NULL, N'Wing-A, Flat No-501, Dhokali Manorama Nagar Kolshet Road Thane West', N'189, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, N'', N'501', NULL, N'Wing-A, Flat No-501, Dhokali Manorama Nagar Kolshet Road Thane West', N'189, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (608764, N'1', N'MM10', N'1', N'', 51, N'MM1000010000', 0, N'45', N'98/440 ', N'', 1, NULL, N'Mr', N'SHRI. S. G.  KHALE HOLTIME DIRCTOR M/S. BOMBAY CHEMICALS PVT. LTD.,', N'Mr', N'THE LICENSEE: M/S. LANDMARK CAR LTD.,', N'', N'LANDMARK CARS', N'BOMBAY CHEMICALS PVT. LTD. THE LICENSEE : M/S LANDMARK CAR PVT. LTD. 275/A/2/2A, PATLIPADA, NEAR ST. XAVIER''S SCHOOL, G.B.ROAD, THANE (W.) 400607', N'5, S Vivekanand Marg, Brahmand, Manpada, Thane, Maharashtra 400607, India ', N'9869905413', N'', NULL, N'', N'à¤¶à¥à¤°à¥€. à¤à¤¸. à¤œà¥€. à¤—à¥‹à¤–à¤²à¥‡, à¤ªà¥‚à¤°à¥à¤£à¤µà¥‡à¤³ à¤¸à¤‚à¤šà¤¾à¤²à¤•, à¤®à¥‡à¤¸à¤°à¥à¤¸ à¤¬à¥‰à¤®à¥à¤¬à¥‡ à¤•à¥‡à¤®à¤¿à¤•à¤²à¥à¤¸ à¤ªà¥à¤°à¤¾à¤¯à¤µà¥à¤¹à¥‡à¤Ÿ à¤²à¤¿à¤®à¤¿à¤Ÿà¥‡à¤¡', N'', N'', N'', N'à¤²à¤à¤¡à¤®à¤¾à¤°à¥à¤• à¤•à¤¾à¤°', N'à¤¬à¥‰à¤®à¥à¤¬à¥‡ à¤•à¥‡à¤®à¤¿à¤•à¤²à¥à¤¸ à¤ªà¥à¤°à¤¾à¤¯à¤µà¥à¤¹à¥‡à¤Ÿ à¤²à¤¿à¤®à¤¿à¤Ÿà¥‡à¤¡. à¤ªà¤¾à¤Ÿà¤²à¥€à¤ªà¤¾à¤¡à¤¾, à¤¸à¥‡à¤‚à¤Ÿ à¤à¥‡à¤µà¤¿à¤¯à¤°à¥à¤¸ à¤¸à¥à¤•à¥‚à¤² à¤œà¤µà¤³, à¤œà¥€à¤¬à¥€à¤°à¥‹à¤¡, à¤ à¤¾à¤£à¥‡ (à¤µà¥‡à¤¸à¥à¤Ÿ ) à¥ªà¥¦à¥¦à¥¬à¥¦à¥­', N'5, S Vivekanand Marg, Brahmand, Manpada, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (608857, N'1', N'MM10', N'2', N'', 12, N'MM1000020000', 0, N'', NULL, N'', 1, NULL, N'Mr', N'CLOVERDALE CO-OP HOUSING SOCIETY LIMITED    ', N'', N'', N'', N'', N'BOMBAY CHEMICALS PVT. LTD. THE LICENSEE : M/S LANDMARK CAR PVT. LTD. 275/A/2/2A, PATLIPADA, NEAR ST. XAVIER''S SCHOOL, G.B.ROAD, THANE (W.) 400607', N'1303, Cloverdale, One Hiranandani Park, Brahmand, Thane West, Thane, Maharashtra 400607, India ', N'8169048567', N'', NULL, N'', N'.', N'', N'', N'', N'', N'', N'1303, Cloverdale, One Hiranandani Park, Brahmand, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 74, CAST(N'2025-09-16T12:49:15.893' AS DateTime)),
 
 (608928, N'1', N'MM10', N'5', N'', 12, N'MM1000050000', 0, N'', NULL, N'', 1, NULL, N'Mr', N'HAMPTON CO-OP HOUSING SOCIETY LIMITED', N'', N'THE HOLDER', N'', N'', N'HAMPTON,ONE HIRANANDANI PARK,PATLIPADA,GB ROAD,THANE WEST-400615', N'403, Willowcrest, One Hiranandani Park, Patlipada, Thane West, Brahmand, Thane, Maharashtra 400607, India ', N'9136821218', N'', NULL, N'', N'HAMPTON CO-OP HOUSING SOCIETY LIMITED', N'', N'', N'', N'', N'', N'403, Willowcrest, One Hiranandani Park, Patlipada, Thane West, Brahmand, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 60, CAST(N'2025-08-28T15:01:57.880' AS DateTime)),
 
 (608935, N'1', N'MM10', N'6', N'', 12, N'MM1000060000', 0, N'', NULL, N'', 1, NULL, N'Mr', N'EAGLETON CO-OP HOUSING SOCIETY LIMITED', N'', N'THE HOLDER', N'', N'', N'One Hiranandani Park Patlipada GB Road Thane West', N'2, S Vivekanand Marg, Brahmand, Manpada, Thane, Maharashtra 400607, India ', N'9619919019', N'', NULL, N'', N' EAGLETON CO-OP HOUSING SOCIETY .LTD   ', N'', N'', N'', N'', N'', N'2, S Vivekanand Marg, Brahmand, Manpada, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 60, CAST(N'2025-09-05T13:00:58.753' AS DateTime)),
 
 (608985, N'1', N'MM10', N'7', N'', 12, N'MM1000070000', 0, N'', NULL, N'', 1, NULL, N'Mr', N'CLIFTON  CO-OPERATIVE HOUSING SOCIETY LIMITED', N'', N'THE HOLDER', N'', N'', N'CLIFTON BLDG,NEAR GHODBANDAR ROAD THANE(W)', N'2, S Vivekanand Marg, Brahmand, Manpada, Thane, Maharashtra 400607, India ', N'9819502727', N'', NULL, N'', N'CLIFTON  CO-OPERATIVE HOUSING SOCIETY LIMITED ', N'', N'', N'', N'', N'', N'2, S Vivekanand Marg, Brahmand, Manpada, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 60, CAST(N'2025-08-26T14:05:10.887' AS DateTime)),
 
 (609019, N'1', N'MM10', N'8', N'', 12, N'MM1000080000', 0, N'', NULL, N'', 1, NULL, N'Mr', N'PRESTON CO-OP HOUSING SOCIETY LIMITED', N'', N'THE HOLDER', N'', N'', N'Survey No. 99/2 Preston Tower, One Hiranandani Park, Patlipada, Thane(W)', N'6XVG+MQX, Ghodbunder Service Rd, Brahmand, Thane West, Thane, Maharashtra 400607, India ', N'9821705686', N'', NULL, N'', N'.', N'', N'', N'', N'', N'', N'6XVG+MQX, Ghodbunder Service Rd, Brahmand, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 60, CAST(N'2025-08-28T18:27:09.703' AS DateTime)),
 
 (609287, N'1', N'MM10', N'4', N'A1', 12, N'MM10000400A1', 0, NULL, NULL, NULL, 1, NULL, NULL, N'The Holder', NULL, NULL, N'101', NULL, N'Wing-A, Flat No-101, One Hiranandani Park Patlipada GB Road Thane West', N'Hiranandani Park Willowcrest, Brahmand, Thane West, Thane, Maharashtra, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'101', NULL, N'Wing-A, Flat No-101, One Hiranandani Park Patlipada GB Road Thane West', N'Hiranandani Park Willowcrest, Brahmand, Thane West, Thane, Maharashtra, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (609288, N'1', N'MM10', N'4', N'A2', 12, N'MM10000400A2', 0, NULL, NULL, NULL, 1, NULL, NULL, N'FLAT HOLDER:', NULL, N'WILLOWCREST, M/S ROMA BUILDERS PVT. LTD.', N'201', NULL, N'Wing-A, Flat No-201, One Hiranandani Park Patlipada GB Road Thane West', N'Hiranandani Park Willowcrest, Brahmand, Thane West, Thane, Maharashtra, India ', N'9322952476', NULL, NULL, NULL, NULL, NULL, NULL, N'201', NULL, N'Wing-A, Flat No-201, One Hiranandani Park Patlipada GB Road Thane West', N'Hiranandani Park Willowcrest, Brahmand, Thane West, Thane, Maharashtra, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (609289, N'1', N'MM10', N'4', N'A3', 12, N'MM10000400A3', 0, NULL, NULL, NULL, 1, NULL, NULL, N'FLAT HOLDER: ARCHANA MANGALAGIRI / RANJANA MANGALAGIRI   WILLOWCREST, M/S ROMA BUILDERS PVT. LTD.', NULL, N'', N'301', NULL, N'Wing-A, Flat No-301, One Hiranandani Park Patlipada GB Road Thane West', N'Hiranandani Park Willowcrest, Brahmand, Thane West, Thane, Maharashtra, India ', N'9920695522', NULL, NULL, NULL, NULL, NULL, NULL, N'301', NULL, N'Wing-A, Flat No-301, One Hiranandani Park Patlipada GB Road Thane West', N'Hiranandani Park Willowcrest, Brahmand, Thane West, Thane, Maharashtra, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (609290, N'1', N'MM10', N'4', N'A4', 12, N'MM10000400A4', 0, NULL, NULL, NULL, 1, NULL, NULL, N'FLAT HOLDER:', NULL, N'WILLOWCREST, M/S ROMA BUILDERS PVT. LTD.', N'401', NULL, N'Wing-A, Flat No-401, One Hiranandani Park Patlipada GB Road Thane West', N'Hiranandani Park Willowcrest, Brahmand, Thane West, Thane, Maharashtra, India ', N'7208489397', NULL, NULL, NULL, NULL, NULL, NULL, N'401', NULL, N'Wing-A, Flat No-401, One Hiranandani Park Patlipada GB Road Thane West', N'Hiranandani Park Willowcrest, Brahmand, Thane West, Thane, Maharashtra, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (750338, N'1', N'LSMAJOR1', N'1', N'D1', 12, NULL, 0, N'', NULL, N'', 1, NULL, NULL, N'The Holder', NULL, NULL, N'101', NULL, N'Wing-D, Flat No-101, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'101', NULL, N'Wing-D, Flat No-101, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (750339, N'1', N'LSMAJOR1', N'1', N'D2', 12, NULL, 0, N'', NULL, N'', 1, NULL, NULL, N'The Holder', NULL, NULL, N'201', NULL, N'Wing-D, Flat No-201, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'201', NULL, N'Wing-D, Flat No-201, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (750340, N'1', N'LSMAJOR1', N'1', N'D3', 12, NULL, 0, N'', NULL, N'', 1, NULL, NULL, N'The Holder', NULL, NULL, N'301', NULL, N'Wing-D, Flat No-301, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'301', NULL, N'Wing-D, Flat No-301, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (750341, N'1', N'LSMAJOR1', N'1', N'D4', 12, NULL, 0, N'', NULL, N'', 1, NULL, NULL, N'The Holder', NULL, NULL, N'401', NULL, N'Wing-D, Flat No-401, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'401', NULL, N'Wing-D, Flat No-401, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (750342, N'1', N'LSMAJOR1', N'1', N'D5', 12, NULL, 0, N'', NULL, N'', 1, NULL, NULL, N'The Holder', NULL, NULL, N'501', NULL, N'Wing-D, Flat No-501, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'501', NULL, N'Wing-D, Flat No-501, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (750343, N'1', N'LSMAJOR1', N'1', N'D6', 12, NULL, 0, N'', NULL, N'', 1, NULL, NULL, N'The Holder', NULL, NULL, N'601', NULL, N'Wing-D, Flat No-601, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'601', NULL, N'Wing-D, Flat No-601, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (750344, N'1', N'LSMAJOR1', N'1', N'D7', 12, NULL, 0, N'', NULL, N'', 1, NULL, NULL, N'The Holder', NULL, NULL, N'701', NULL, N'Wing-D, Flat No-701, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'701', NULL, N'Wing-D, Flat No-701, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (750345, N'1', N'LSMAJOR1', N'1', N'D8', 12, NULL, 0, N'', NULL, N'', 1, NULL, NULL, N'The Holder', NULL, NULL, N'801', NULL, N'Wing-D, Flat No-801, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'801', NULL, N'Wing-D, Flat No-801, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (750346, N'1', N'LSMAJOR1', N'1', N'D9', 12, NULL, 0, N'', NULL, N'', 1, NULL, NULL, N'The Holder', NULL, NULL, N'901', NULL, N'Wing-D, Flat No-901, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'901', NULL, N'Wing-D, Flat No-901, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
    (750347, N'1', N'LSMAJOR1', N'1', N'D10', 12, NULL, 0, N'', NULL, N'', 1, NULL, NULL, N'The Holder', NULL, NULL, N'1001', NULL, N'Wing-D, Flat No-1001, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'1001', NULL, N'Wing-D, Flat No-1001, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL)
) AS pd(PropertyId, TaxZoneId, WardId, PropertyNo, PartitionNo, PropertyTypeId, UPICId, OpenPlot, CSN, SubZoneNo, PlotNo, CategoryId, Type,  OwnerTitle, OwnerName, OccupierTitle, OccupierName, FlatOrShopNo, FlatOrShopName, Address, Location, MobileNo, EmailId, WingDetailId, OwnerTitleEnglish, OwnerNameEnglish, OccupierTitleEnglish, OccupierNameEnglish, FlatOrShopNoEnglish, FlatOrShopNameEnglish, AddressEnglish, LocationEnglish, MarkedForDeletion, IsActive, CreatedBy, CreatedDate, UpdatedBy, UpdatedDate)
INNER JOIN PTIS.TaxZoneMaster tz ON pd.TaxZoneId = tz.TaxZoneNo
INNER JOIN PTIS.WardMaster wm ON pd.WardId = wm.wardNo;
GO

SET IDENTITY_INSERT [PTIS].[PropertyMast] OFF;
GO



------------------------------------------------

SET IDENTITY_INSERT [PTIS].[PropertyDetails] ON;
GO

INSERT INTO [PTIS].[PropertyDetails]
(
    Id,
    IsTaxable,
    PropertyId,
    FloorId,
    SubFloorId,
    ConstructionYear,
    AssessmentYear,
    ConstructionTypeId,
    TypeOfUseId,
    SubTypeOfUseId,
    CarpetAreaSqMeter,
    CarpetAreaSqFeet,
    BuiltupAreaSqMeter,
    BuiltupAreaSqFeet,
    NoOfRooms,
    IsRenter,
    MarkedForDeletion,
    MarkedForDeletionDate,
    IsActive,
    CreatedBy,
    CreatedDate,
    UpdatedBy,
    UpdatedDate
)
SELECT
    pd.Id,
    ISNULL(pd.IsTaxable, 0),
    pd.PropertyId,
    fm.Id,
    sfm.Id,
    pd.ConstructionYear,
    pd.AssessmentYear,
    ct.Id,
    COALESCE(tou.Id, touDefault.Id),
    pd.SubTypeOfUseCode,
    pd.CarpetAreaSqMeter,
    pd.CarpetAreaSqFeet_DELETE,
    pd.BuiltupAreaSqMeter,
    pd.BuiltupAreaSqFeet_DELETE,
    pd.NoOfRooms,
    CAST(ISNULL(pd.RenterYesNO,0) AS BIT),
    ISNULL(pd.MarkedForDeletion,0),
    NULL,
    1,
    pd.CreatedBy,
    ISNULL(pd.CreatedDate, GETDATE()),
    pd.UpdatedBy,
    pd.UpdatedDate
FROM
( VALUES
   (206082, 552374, N'G', N'Attic', N'2025', N'2014', N'A', N'R', 243.91, 22.66, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 292.69, 27.19, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206083, 552375, N'1', N'Attic', N'2025', N'2014', N'A', N'R', 243.91, 22.66, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 292.69, 27.19, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206084, 552376, N'2', N'Attic', N'2025', N'2014', N'A', N'R', 243.91, 22.66, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 292.69, 27.19, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206085, 552377, N'3', N'Attic', N'2025', N'2014', N'A', N'R', 243.91, 22.66, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 292.69, 27.19, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206086, 552378, N'4', N'Attic', N'2025', N'2014', N'A', N'R', 243.91, 22.66, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 292.69, 27.19, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206087, 552379, N'G', N'Attic', N'2025', N'2014', N'A', N'R', 243.91, 22.66, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 292.69, 27.19, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206088, 552380, N'1', N'Attic', N'2025', N'2014', N'A', N'R', 243.91, 22.66, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 292.69, 27.19, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206089, 553035, N'G', N'Attic', N'2025', N'2017', N'A', N'R', 254.68, 23.66, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 305.62, 28.39, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206090, 553036, N'1', N'Attic', N'2025', N'2017', N'A', N'R', 309.68, 28.77, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 371.62, 34.52, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206091, 553037, N'2', N'Attic', N'2025', N'2017', N'A', N'R', 309.68, 28.77, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 371.62, 34.52, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206092, 553038, N'3', N'Attic', N'2025', N'2017', N'A', N'R', 309.68, 28.77, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 371.62, 34.52, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206093, 553039, N'4', N'Attic', N'2025', N'2017', N'A', N'R', 309.68, 28.77, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 371.62, 34.52, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206094, 553040, N'5', N'Attic', N'2025', N'2017', N'A', N'R', 309.68, 28.77, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 371.62, 34.52, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206095, 553041, N'G', N'Attic', N'2025', N'2017', N'A', N'R', 268.35, 24.93, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 322.02, 29.92, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206096, 560660, N'1', N'Attic', N'2024', NULL, N'A', N'R', 100, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206097, 560669, N'5', N'Attic', N'2024', NULL, N'A', N'R', 80, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206098, 560661, N'2', N'Attic', N'2024', NULL, N'A', N'R', 70, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206099, 560662, N'3', N'Attic', N'2024', NULL, N'A', N'R', 80, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206100, 560663, N'4', N'Attic', N'2024', NULL, N'A', N'R', 50, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206101, 560664, N'5', N'Attic', N'2024', NULL, N'A', N'R', 70, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206102, 560665, N'6', N'Attic', N'2024', NULL, N'A', N'R', 20, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206103, 560666, N'7', N'Attic', N'2024', NULL, N'A', N'R', 70, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206104, 560667, N'7', N'Attic', N'2024', NULL, N'A', N'R', 70, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206105, 560668, N'6', N'Attic', N'2024', NULL, N'A', N'R', 70, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206106, 579099, N'G', N'Attic', N'2025', N'2024', N'A', N'R', 208.39, 19.36, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 250.07, 23.23, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206107, 579100, N'1', N'Attic', N'2025', N'2024', N'A', N'ABLR', 49.19, 4.57, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 59.03, 5.48, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206108, 579100, N'1', N'Attic', N'2025', N'2024', N'A', N'R', 408.92, 37.99, 4, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 490.7, 45.59, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,

   (206109, 577957, N'2', N'Attic', N'2023', N'2025', N'A', N'ABLR', 70.07, 6.51, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 84.08, 7.81, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'0', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206110, 577957, N'3', N'Attic', N'2023', N'2025', N'A', N'ABLR', 391.81, 36.4, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 470.17, 43.68, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'0', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206111, 577957, N'3', N'Attic', N'2023', N'2025', N'A', N'SR', 71.69, 6.66, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 86.03, 7.99, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'0', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206112, 577957, N'G', N'Attic', N'2023', NULL, N'A', N'R', 829.47, 77.06, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 995.36, 92.47, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206113, 577957, N'1', N'Attic', N'2023', N'2023', N'A', N'R', 999.55, 92.86, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 1199.46, 111.43, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206114, 577957, N'2', N'Attic', N'2023', N'2025', N'A', N'R', 1008.16, 93.66, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 1209.79, 112.39, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'0', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206115, 577957, N'3', N'Attic', N'2023', N'2025', N'A', N'R', 577.6, 53.66, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 693.12, 64.39, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'0', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206116, 556010, N'1', N'Attic', N'2025', N'2025', N'A', N'R', 393.53, 36.56, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 472.24, 43.87, N'Self', 0, CAST(N'2025-06-30T00:00:00.000' AS DateTime), 0, N'0', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206117, 556010, N'1', N'Attic', N'2025', N'2025', N'A', N'ABLR', 36.6, 3.4, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 43.92, 4.08, N'Self', 0, CAST(N'2025-06-30T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206118, 556011, N'2', N'Attic', N'2025', N'2025', N'A', N'R', 393.53, 36.56, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 472.24, 43.87, N'Self', 0, CAST(N'2025-06-30T00:00:00.000' AS DateTime), 0, N'0', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206119, 556011, N'2', N'Attic', N'2025', N'2025', N'A', N'ABLR', 36.6, 3.4, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 43.92, 4.08, N'Self', 0, CAST(N'2025-06-30T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206120, 556012, N'3', N'Attic', N'2025', N'2025', N'A', N'R', 393.53, 36.56, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 472.24, 43.87, N'Self', 0, CAST(N'2025-06-30T00:00:00.000' AS DateTime), 0, N'0', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206121, 556012, N'3', N'Attic', N'2025', N'2025', N'A', N'ABLR', 36.6, 3.4, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 43.92, 4.08, N'Self', 0, CAST(N'2025-06-30T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206122, 556013, N'4', N'Attic', N'2025', N'2025', N'A', N'R', 393.53, 36.56, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 472.24, 43.87, N'Self', 0, CAST(N'2025-06-30T00:00:00.000' AS DateTime), 0, N'0', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206123, 556013, N'4', N'Attic', N'2025', N'2025', N'A', N'ABLR', 36.6, 3.4, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 43.92, 4.08, N'Self', 0, CAST(N'2025-06-30T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206124, 556014, N'5', N'Attic', N'2025', N'2025', N'A', N'R', 393.53, 36.56, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 472.24, 43.87, N'Self', 0, CAST(N'2025-06-30T00:00:00.000' AS DateTime), 0, N'0', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206125, 556014, N'5', N'Attic', N'2025', N'2025', N'A', N'ABLR', 36.6, 3.4, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 43.92, 4.08, N'Self', 0, CAST(N'2025-06-30T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206126, 556015, N'6', N'Attic', N'2025', N'2025', N'A', N'R', 393.53, 36.56, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 472.24, 43.87, N'Self', 0, CAST(N'2025-06-30T00:00:00.000' AS DateTime), 0, N'0', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206127, 556015, N'6', N'Attic', N'2025', N'2025', N'A', N'ABLR', 36.6, 3.4, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 43.92, 4.08, N'Self', 0, CAST(N'2025-06-30T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206128, 556016, N'7', N'Attic', N'2025', N'2025', N'A', N'R', 393.53, 36.56, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 472.24, 43.87, N'Self', 0, CAST(N'2025-06-30T00:00:00.000' AS DateTime), 0, N'0', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206129, 556016, N'7', N'Attic', N'2025', N'2025', N'A', N'ABLR', 36.6, 3.4, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 43.92, 4.08, N'Self', 0, CAST(N'2025-06-30T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206130, 556017, N'8', N'Attic', N'2025', N'2025', N'A', N'R', 393.53, 36.56, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 472.24, 43.87, N'Self', 0, CAST(N'2025-06-30T00:00:00.000' AS DateTime), 0, N'0', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206131, 556017, N'8', N'Attic', N'2025', N'2025', N'A', N'ABLR', 36.6, 3.4, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 43.92, 4.08, N'Self', 0, CAST(N'2025-06-30T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206132, 750338, N'1', N'Attic', N'2007', N'2007', N'A', N'R', 0, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206133, 750347, N'10', N'Attic', N'2007', N'2007', N'A', N'R', 0, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206134, 750339, N'2', N'Attic', N'2007', N'2007', N'A', N'R', 0, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206135, 750340, N'3', N'Attic', N'2007', N'2007', N'A', N'R', 0, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206136, 750341, N'4', N'Attic', N'2007', N'2007', N'A', N'R', 0, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206137, 750342, N'5', N'Attic', N'2007', N'2007', N'A', N'R', 0, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206138, 750343, N'6', N'Attic', N'2007', N'2007', N'A', N'R', 0, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206139, 750344, N'7', N'Attic', N'2007', N'2007', N'A', N'R', 0, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206140, 750345, N'8', N'Attic', N'2007', N'2007', N'A', N'R', 0, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206141, 750346, N'9', N'Attic', N'2007', N'2007', N'A', N'R', 0, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206142, 550296, N'G', N'Attic', N'2012', N'2012', N'A', N'WC', 44.13, 4.1, 0, 1, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 52.96, 4.92, N'Self', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206143, 550296, N'1', N'Attic', N'2012', N'2012', N'A', N'WC', 105.92, 9.84, 0, 1, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 127.1, 11.81, N'Self', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206144, 550296, N'G', N'Attic', N'2012', N'2012', N'A', N'D', 611.07, 56.769999999999996, 4, 1, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 733.28, 68.12, N'Self', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206145, 550296, N'1', N'Attic', N'2012', N'2012', N'A', N'D', 333.58, 30.99, 2, 1, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 400.3, 37.19, N'Self', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206146, 550296, N'1', N'Attic', N'2012', N'2012', N'C', N'D', 360.92, 33.53, 2, 1, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 433.1, 40.24, N'Self', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206147, 550299, N'G', N'Attic', N'2014', N'2014', N'A', N'WR', 72.33, 6.72, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 86.8, 8.06, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206148, 550299, N'1', N'Attic', N'2014', N'2014', N'A', N'WR', 122.71, 11.4, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 147.25, 13.68, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206149, 550299, N'G', N'Attic', N'2014', N'2014', N'A', N'R', 607.09, 56.4, 4, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 728.51, 67.68, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206150, 550299, N'G', N'Attic', N'2018', N'2018', N'E', N'SR', 104.84, 9.74, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 125.81, 11.69, N'Self', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206151, 550299, N'1', N'Attic', N'2014', N'2014', N'A', N'R', 442.72, 41.129999999999995, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 531.26, 49.36, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206152, 550299, N'1', N'Attic', N'2014', N'2014', N'C', N'R', 105.49, 9.8, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 126.59, 11.76, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206153, 550299, N'2', N'Attic', N'2014', N'2014', N'E', N'R', 623.13, 57.89, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 747.76, 69.47, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206154, 550300, N'G', N'Attic', N'2015', N'2015', N'A', N'WEP', 123.79, 11.5, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 148.55, 13.8, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206155, 550300, N'1', N'Attic', N'2015', N'2015', N'A', N'WEP', 56.51, 5.25, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 67.81, 6.3, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206156, 550300, N'G', N'Attic', N'2015', N'2015', N'A', N'EP', 582.66, 54.13, 4, 1, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 699.19, 64.96, N'Self', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206157, 550300, N'1', N'Attic', N'2015', N'2015', N'A', N'EP', 348.22, 32.35, 3, 1, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 417.86, 38.82, N'Self', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206158, 550300, N'1', N'Attic', N'2015', N'2015', N'C', N'EP', 161.89, 15.04, 1, 1, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 194.27, 18.05, N'Self', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206159, 550304, N'1', N'Attic', N'2015', N'2015', N'A', N'EP', 557.68, 51.81, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 669.22, 62.17, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206160, 550304, N'1', N'Attic', N'2015', N'2015', N'C', N'EP', 367.81, 34.17, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 441.37, 41, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206161, 550304, N'G', N'Attic', N'2015', N'2015', N'A', N'WEP', 84.5, 7.85, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 101.4, 9.42, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206162, 550304, N'1', N'Attic', N'2015', N'2015', N'A', N'WEP', 149.3, 13.87, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 179.16, 16.64, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206163, 550304, N'G', N'Attic', N'2015', N'2015', N'A', N'EP', 839.27, 77.97, 5, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 1007.12, 93.56, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206164, 550304, N'G', N'Attic', N'2015', N'2015', N'C', N'EP', 125.94, 11.7, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 151.13, 14.04, N'Self', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206165, 550514, N'M', N'Attic', N'1999', N'1999', N'A', N'S', 94.18, 8.75, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 113.02, 10.5, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206166, 550514, N'G', N'Attic', N'1999', N'1999', N'A', N'H', 297.62, 27.65, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 357.14, 33.18, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206167, 550514, N'G', N'Attic', N'1999', N'1999', N'A', N'S', 355.75, 33.05, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 426.9, 39.66, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206168, 550514, N'1', N'Attic', N'1999', N'1999', N'C', N'H', 790.72, 73.46, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 948.86, 88.15, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206169, 550516, N'G', N'Attic', N'1999', N'1999', N'B', N'S', 698.8, 64.92, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 838.56, 77.9, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206170, 550516, N'G', N'Attic', N'1999', N'1999', N'B', N'S', 59.09, 5.49, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 70.91, 6.59, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206171, 550516, N'1', N'Attic', N'1999', N'1999', N'C', N'R', 497.51, 46.22, 4, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 597.01, 55.46, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206172, 550722, N'G', N'Attic', N'2016', N'2016', N'C', N'R', 203.22, 18.88, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 243.86, 22.66, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206173, 550726, N'G', N'Attic', N'2016', N'2016', N'C', N'R', 203.22, 18.880000000000003, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 243.86, 22.66, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206174, 550727, N'G', N'Attic', N'2016', N'2016', N'C', N'R', 203.22, 18.88, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 243.86, 22.66, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206175, 550728, N'G', N'Attic', N'2016', N'2016', N'C', N'R', 203.22, 18.880000000000003, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 243.86, 22.66, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206176, 608764, N'G', N'Attic', N'2020', N'2020', N'A', N'O', 3875.69, 360.06, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 4650.83, 432.07, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206177, 608764, N'G', N'Attic', N'2020', N'2020', N'C', N'C', 15988.31, 1485.35, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 19185.97, 1782.42, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206178, 608764, N'1', N'Attic', N'2020', N'2020', N'C', N'O', 2476.15, 230.04, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 2971.38, 276.05, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206179, 608764, N'G', N'Attic', N'2020', N'2020', N'A', N'C', 2367.76, 219.97, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 2841.31, 263.96, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206180, 608764, N'G', N'Attic', N'2020', N'2020', N'C', N'C', 6744.4, 626.56999999999994, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 8093.28, 751.88, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206181, 608764, N'1', N'Attic', N'2020', N'2020', N'A', N'O', 3132.54, 291.02, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 3759.05, 349.22, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206182, 608764, N'1', N'Attic', N'2020', N'2020', N'B', N'R', 67.27, 6.25, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 80.72, 7.5, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206183, 608764, N'G', N'Attic', N'2020', N'2020', N'C', N'C', 80.73, 7.5, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 96.88, 9, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206184, 608764, N'M', N'Attic', N'2020', N'2020', N'C', N'C', 3073.01, 285.49, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 3687.61, 342.59, N'', 0, NULL, 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206185, 608764, N'G', N'Attic', N'2020', N'2020', N'A', N'OPKC', 31534.64, 2929.64, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 37841.57, 3515.57, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206186, 608764, N'G', N'Attic', N'2020', N'2020', N'A', N'OPKC', 2186.28, 203.11, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 2623.54, 243.73, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206187, 609287, N'1', N'Attic', N'2000', NULL, N'A', N'R', 0, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206188, 609288, N'2', N'Attic', N'2000', NULL, N'A', N'R', 0, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206189, 609289, N'3', N'Attic', N'2000', NULL, N'A', N'R', 0, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206190, 609290, N'4', N'Attic', N'2000', NULL, N'A', N'R', 0, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206191, 549357, N'1', N'Attic', N'2025', N'2025', N'A', N'SPK', 1666.59, 154.83, 0, 1, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 1999.91, 185.8, N'Self', 0, CAST(N'2025-06-27T18:32:59.967' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206192, 549357, N'1', N'Attic', N'2025', N'2025', N'A', N'SPK', 34423.27, 3198, 0, 1, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 41307.92, 3837.6, N'Self', 0, CAST(N'2025-06-27T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206193, 549439, N'G', N'Attic', N'2003', N'2003', N'C', N'R', 209.47, 19.46, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 251.36, 23.35, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206194, 549439, N'G', N'Attic', N'2003', N'2003', N'C', N'WR', 29.17, 2.71, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 35, 3.25, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206195, 549441, N'G', N'Attic', N'2003', N'2003', N'C', N'R', 213.23, 19.81, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 255.88, 23.77, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206196, 549441, N'G', N'Attic', N'2003', N'2003', N'C', N'WR', 23.47, 2.18, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 28.16, 2.62, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206197, 549442, N'G', N'Attic', N'2003', N'2003', N'C', N'R', 213.88, 19.87, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 256.66, 23.84, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206198, 549442, N'G', N'Attic', N'2003', N'2003', N'C', N'WR', 23.79, 2.21, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 28.55, 2.65, N'Self', 0, CAST(N'2025-07-30T18:31:26.027' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206199, 549445, N'G', N'Attic', N'2003', N'2003', N'C', N'R', 211.62, 19.66, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 253.94, 23.59, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206200, 549445, N'G', N'Attic', N'2003', N'2003', N'C', N'WR', 23.79, 2.21, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 28.55, 2.65, N'Self', 0, CAST(N'2025-07-30T18:37:33.157' AS DateTime), 0, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206201, 549446, N'G', N'Attic', N'2003', N'2003', N'C', N'R', 234.01, 21.74, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 280.81, 26.09, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206202, 549448, N'G', N'Attic', N'2003', N'2003', N'C', N'R', 238.64, 22.17, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 286.37, 26.6, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206203, 549451, N'G', N'Attic', N'2003', N'2003', N'C', N'R', 238.64, 22.17, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 286.37, 26.6, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206204, 549452, N'G', N'Attic', N'2003', N'2003', N'C', N'R', 235.3, 21.86, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 282.36, 26.23, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206205, 549453, N'G', N'Attic', N'2003', N'2003', N'C', N'R', 238.64, 22.17, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), CAST(N'1900-01-01T00:00:00.000' AS DateTime), 580, 286.37, 26.6, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206206, 599038, N'G', N'Attic', N'1965', N'1965', N'B', N'T', 10.76, 1, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 12.91, 1.2, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206207, 599038, N'G', N'Attic', N'1965', N'1965', N'C', N'I', 311.29, 28.92, 2, 1, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 373.55, 34.7, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206208, 599038, N'G', N'Attic', N'1965', N'1965', N'C', N'C', 188.37, 17.5, 1, 1, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 226.04, 21, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206209, 599038, N'G', N'Attic', N'1965', N'1965', N'A', N'I', 895.35, 83.18, 4, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 1074.42, 99.82, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206210, 599038, N'G', N'Attic', N'1965', N'1965', N'C', N'I', 7091.75, 658.84, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 8510.1, 790.61, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206211, 599038, N'1', N'Attic', N'1965', N'1965', N'C', N'I', 947.45, 88.02, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 1136.94, 105.62, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206212, 602675, N'2', N'Attic', N'2010', N'2010', N'C', N'CC', 2213.83, 205.67, 3, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 2656.6, 246.8, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206213, 602675, N'M', N'Attic', N'2010', N'2010', N'B', N'S', 878.34, 81.6, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 1054.01, 97.92, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206214, 602675, N'G', N'Attic', N'2010', N'2010', N'B', N'S', 2171.1, 201.7, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 2605.32, 242.04, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206215, 602675, N'1', N'Attic', N'2010', N'2010', N'B', N'EP', 4553.06, 422.99, 2, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 5463.67, 507.59, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206216, 602680, N'G', N'Attic', N'1970', N'1970', N'A', N'I', 2057.97, 191.19, 7, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 2469.56, 229.43, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206217, 602680, N'G', N'Attic', N'1970', N'1970', N'C', N'I', 5857.02, 544.13, 12, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 7028.42, 652.96, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206218, 602680, N'G', N'Attic', N'1970', N'1970', N'E', N'I', 629.05, 58.44, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 754.86, 70.13, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206219, 602680, N'G', N'Attic', N'1970', N'1970', N'C', N'I', 2843.85, 264.2, 1, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, 3412.62, 317.04, N'Self', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, N'', 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206220, 604264, N'1', N'Attic', N'2009', NULL, N'A', N'R', 0, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206221, 604265, N'2', N'Attic', N'2009', NULL, N'A', N'R', 0, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206222, 604266, N'3', N'Attic', N'2009', NULL, N'A', N'R', 0, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206223, 604267, N'4', N'Attic', N'2009', NULL, N'A', N'R', 0, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 ,
   (206224, 604268, N'5', N'Attic', N'2009', NULL, N'A', N'R', 0, 0, 0, 0, 0, 0, N'', N'', CAST(N'1900-01-01T00:00:00.000' AS DateTime), NULL, NULL, 580, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime))
 
) AS pd
(
    Id,
    PropertyId,
    FloorCode,
    SubFloorCode,
    ConstructionYear,
    AssessmentYear,
    ConstructionCode,
    TypeOfUseCode,
    CarpetAreaSqFeet_DELETE,
    CarpetAreaSqMeter,
    NoOfRooms,
    RenterYesNO,
    RentMonthly,
    NonCalculateRentMonthly,
    RenterNameEnglish,
    RenterName,
    AgreementFromDate,
    AgreementDate,
    AgreementToDate,
    SubTypeOfUseCode,
    BuiltupAreaSqFeet_DELETE,
    BuiltupAreaSqMeter,
    TaxLiability,
    IsTaxable,
    OccupancyDate,
    OccupancyApplyOrNot,
    OccupancyNumber,
    MarkedForDeletion,
    CreatedBy,
    CreatedDate,
    UpdatedBy,
    UpdatedDate
)
LEFT JOIN PTIS.FloorMaster fm
    ON pd.FloorCode = fm.FloorCode
LEFT JOIN PTIS.SubFloorMaster sfm
    ON pd.SubFloorCode = sfm.SubFloorCode
LEFT JOIN PTIS.ConstructionTypeMaster ct
    ON pd.ConstructionCode = ct.ConstructionCode
LEFT JOIN PTIS.TypeOfUseMaster tou
  ON pd.TypeOfUseCode = tou.TypeOfUseCode
LEFT JOIN PTIS.TypeOfUseMaster touDefault
  ON touDefault.TypeOfUseCode = N'N';
GO

SET IDENTITY_INSERT [PTIS].[PropertyDetails] OFF;
GO


---------------------

SET IDENTITY_INSERT [PTIS].[PropertyMastDetails] ON

INSERT INTO [PTIS].[PropertyMastDetails](
    [Id], [PropertyId], [OwnerTypeId],
    [AssessmentRemark], [SurveyRemark], [FlatSystemRemark], [CombPropRemark],
    [AdharCardNo], [RenterMobileNo],
     [PrarupYadiPublishDate], [AntimYadiPublishDate], [PropertyRegDate],
    [ApplyTaxesFrom], [PartOCDate], [BHKId], [BlockNo],  [AlternetivEmailID],
    [TotalBuiltupAreaSqMeter], [Latitude], [Longitude],
    [NoOfResidentialToilets], [NoOfCommercialToilets], [CreatedBy], [CreatedDate], [UpdatedDate], [UpdatedBy]
)
SELECT 
    pmd.Id, pmd.PropertyId, otm.Id,
    pmd.AssessmentRemark, pmd.SurveyRemark, pmd.FlatSystemRemark, pmd.CombPropRemark,
    pmd.AdharCardNo, pmd.RenterMobileNo,
    pmd.PrarupYadiPublishDate, pmd.AntimYadiPublishDate,
    pmd.PropertyRegDate, pmd.ApplyTaxesFrom, pmd.PartOCDate,
    bhk.Id, pmd.BlockNo, pmd.AlternetivEmailId,
    pmd.TotalBuiltupAreaSqMeter, pmd.Latitude, pmd.Longitude,
    pmd.NoOfResidentialToilets, pmd.NoOfCommercialToilets,
    pmd.CreatedBy, pmd.CreatedDate, pmd.UpdatedDate, pmd.UpdatedBy
FROM (VALUES

  --('400878','549439','Self','','','','',NULL,'','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'','1','1',NULL,'26.6','26.6','19.2378356','72.9918551','1','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('402152','550727','Self','','','','No','','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0',NULL,NULL,'1','1',NULL,'243.86','22.66','19.2580836','72.9648529','1','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('402153','550728','Self','','','','No','','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0',NULL,NULL,'1','1',NULL,'243.86','22.66','19.2580836','72.9648529','1','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('404413','552994','Self','','','','','','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'','2','1',NULL,'0','0','19.1433207','73.0487021','0','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('404452','553033',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,NULL,'2',NULL,NULL,NULL,NULL,'19.1433207','73.0487021',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('404453','553034','Self','','','Flat System','No',NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0',NULL,'.','2',NULL,NULL,'0','0','19.1433207','73.0487021','0','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('404454','553035','Self','','','Flat System',NULL,'','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'1BHK','2',NULL,NULL,'28.39','28.39','19.1433207','73.0487021','1','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('404455','553036','Self','','','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'1BHK','2',NULL,NULL,'34.52','34.52','19.1433207','73.0487021','1','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('404456','553037',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'1BHK','2',NULL,NULL,'371.62','34.52','19.1433207','73.0487021','1','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('404457','553038',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'1BHK','2',NULL,NULL,'371.62','34.52','19.1433207','73.0487021','1','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),

  ('403798','552379','Self',NULL,'','Flat System',NULL,'','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'1RK','1',NULL,NULL,'292.69','27.19','19.1848277','73.0606332','1','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),

  ('401729','550304',NULL,NULL,'',NULL,NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,NULL,'1',NULL,NULL,'2549.4','236.83','19.2505158','72.9716694',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),

  ('407416','556008','Self','','','',NULL,'','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'','1','1',NULL,'0','0','19.2079293','72.9960646','0','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('407418','556010','Self','','','Flat System','No','','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0',NULL,'1BHK','1',NULL,NULL,'47.95','47.95','19.2079293','72.9960646','2','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('407419','556011','Self',NULL,'','Flat System',NULL,'','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'1BHK','1',NULL,NULL,'516.16','47.95','19.2079293','72.9960646','2','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('407420','556012','Self',NULL,'','Flat System',NULL,'','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'1BHK','1',NULL,NULL,'516.16','47.95','19.2079293','72.9960646','2','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('407421','556013','Self','','','Flat System',NULL,'','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'1BHK','1',NULL,NULL,'516.16','47.95','19.2079293','72.9960646','2','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),

  ('407423','556015','Self',NULL,'','Flat System',NULL,'','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'1BHK','1',NULL,NULL,'516.16','47.95','19.2079293','72.9960646','2','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('407424','556016','Self',NULL,'','Flat System',NULL,'','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'1BHK','1',NULL,NULL,'516.16','47.95','19.2079293','72.9960646','2','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('407425','556017','Self',NULL,'','Flat System',NULL,'','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'1BHK','1',NULL,NULL,'516.16','47.95','19.2079293','72.9960646','2','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('412067','560660',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'NA',NULL,NULL,NULL,NULL,NULL,'19.1872308','72.9895797',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('412068','560661',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'NA',NULL,NULL,NULL,NULL,NULL,'19.1872308','72.9895797',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('412069','560662',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'NA',NULL,NULL,NULL,NULL,NULL,'19.1872308','72.9895797',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('412070','560663',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'NA',NULL,NULL,NULL,NULL,NULL,'19.1872308','72.9895797',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('412071','560664',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'NA',NULL,NULL,NULL,NULL,NULL,'19.1872308','72.9895797',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('412072','560665',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'NA',NULL,NULL,NULL,NULL,NULL,'19.1872308','72.9895797',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('412073','560666',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'NA',NULL,NULL,NULL,NULL,NULL,'19.1872308','72.9895797',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('412074','560667',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'NA',NULL,NULL,NULL,NULL,NULL,'19.1872308','72.9895797',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('412075','560668',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'NA',NULL,NULL,NULL,NULL,NULL,'19.1872308','72.9895797',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('412076','560669',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'NA',NULL,NULL,NULL,NULL,NULL,'19.1872308','72.9895797',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('428341','576936','Self','','','','','','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'','1','1',NULL,'0','0','19.1987498','72.9887876','1','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('428344','576939','Self','','','','','','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'','9','1',NULL,'0','0',NULL,NULL,'0','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('428590','577185','Self','','','','','','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'','9','1',NULL,'0','0','19.1963293','72.9895487','0','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('428842','577437','Self','','','','','','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'','3','1',NULL,'0','0','19.1962243','72.9895354','0','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('428943','577538','Self','','','','','','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'','9','1',NULL,'0','0','19.1955653','72.9895717','0','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('429362','577957','Self','','','','','','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'','9','1',NULL,'0','0','19.1955653','72.9895717','0','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),

  ('430502','579097',NULL,NULL,'','Flat System',NULL,'','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,NULL,'1','1',NULL,NULL,NULL,'19.1987498','72.9887876','0',NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('430503','579098','Self','','','','No','','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0',NULL,'','1','1',NULL,'0','0','19.1987498','72.9887876','0','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('430504','579099','Self','','','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'1RK','1',NULL,NULL,'23.23','23.23','19.1987498','72.9887876','1','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('430505','579100','Self','','','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'2BHK','1',NULL,NULL,'51.07','51.07','19.1987498','72.9887876','2','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('450440','599038','Self',NULL,'',NULL,NULL,'','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,NULL,'1','1',NULL,'1028.22','1028.22','19.2302081','72.9799718','0','1','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('454178','602675','Self',NULL,'',NULL,NULL,'','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,NULL,'1','1',NULL,'1094.35','1094.35','19.2279065','72.9814111','0','11','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('454183','602680','Self','','','','No','','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0',NULL,'','1','1',NULL,'1269.55','1269.55','19.2282937','72.9819361','0','4','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('455598','604230',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,NULL,'1',NULL,NULL,NULL,NULL,'19.2296854','72.982268',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('455599','604231',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,NULL,'1',NULL,NULL,NULL,NULL,'19.2296854','72.982268',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('455632','604264',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'NA','1',NULL,NULL,NULL,NULL,'19.2305136','72.9823096',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('455633','604265',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'NA','1',NULL,NULL,NULL,NULL,'19.2305136','72.9823096',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('455634','604266',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'NA','1',NULL,NULL,NULL,NULL,'19.2305136','72.9823096',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('455635','604267',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'NA','1',NULL,NULL,NULL,NULL,'19.2305136','72.9823096',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('455636','604268',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'NA','1',NULL,NULL,NULL,NULL,'19.2305136','72.9823096',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('460131','608764','Self',NULL,'',NULL,NULL,'','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,NULL,'1','1',NULL,'79087.9','7347.44','19.2420871','72.9763027','0','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('460233','608857','Self','','','','No','','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0',NULL,'','1','1',NULL,'0','0','19.2426911','72.9762292','0','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  --('460304','608928','Self',NULL,'','','','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,NULL,'2','1',NULL,NULL,NULL,'19.2432112','72.9780686','2','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  --('460311','608935','Self',NULL,'','','','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,NULL,'1','1',NULL,NULL,NULL,'19.2434295','72.9780135','2','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  --('460361','608985','Self',NULL,'','','','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,NULL,'1','1',NULL,NULL,NULL,'19.2439234','72.9781925','2','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  --('460395','609019','Self',NULL,'','','','','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,NULL,'1','1',NULL,NULL,NULL,'19.2442522','72.9774197','2','0','0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('460663','609287',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'NA','1',NULL,NULL,NULL,NULL,'19.2425884','72.9778597',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('460664','609288',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'NA','1',NULL,NULL,NULL,NULL,'19.2425884','72.9778597',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('460665','609289',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'NA','1',NULL,NULL,NULL,NULL,'19.2425884','72.9778597',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('460666','609290',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'NA','1',NULL,NULL,NULL,NULL,'19.2425884','72.9778597',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('577859','750338',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'2BHK','',NULL,NULL,NULL,NULL,'','',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('577860','750339',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'2BHK','',NULL,NULL,NULL,NULL,'','',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('577861','750340',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'2BHK','',NULL,NULL,NULL,NULL,'','',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('577862','750341',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'2BHK','',NULL,NULL,NULL,NULL,'','',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('577863','750342',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'2BHK','',NULL,NULL,NULL,NULL,'','',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('577864','750343',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'2BHK','',NULL,NULL,NULL,NULL,'','',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('577865','750344',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'2BHK','',NULL,NULL,NULL,NULL,'','',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('577866','750345',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'2BHK','',NULL,NULL,NULL,NULL,'','',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('577867','750346',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'2BHK','',NULL,NULL,NULL,NULL,'','',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0'),
  ('577868','750347',NULL,NULL,'','Flat System',NULL,NULL,'','','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000',NULL,NULL,NULL,'2BHK','',NULL,NULL,NULL,NULL,'','',NULL,NULL,'0','1900-01-01 00:00:00.000','1900-01-01 00:00:00.000','0')

) AS pmd(
    Id, PropertyId, OwnerTypeCode, AssessmentRemark, SurveyRemark,
    FlatSystemRemark, CombPropRemark, AdharCardNo, RenterMobileNo,
    AssessmentNo, PrarupYadiPublishDate, AntimYadiPublishDate, PropertyRegDate, ApplyTaxesFrom,
    PartOCDate, BHK, BlockNo, UsageCategoryID, AlternetivEmailID, TotalBuiltupAreaSqFeet_DELETE,
    TotalBuiltupAreaSqMeter, Latitude, Longitude, NoOfResidentialToilets, NoOfCommercialToilets,
    CreatedBy, CreatedDate, UpdatedDate, UpdatedBy
)
LEFT JOIN PTIS.OwnerTypeMaster otm ON pmd.OwnerTypeCode = otm.OwnerType
LEFT JOIN CORE.BHKMaster bhk ON pmd.BHK = bhk.BHKCode;

SET IDENTITY_INSERT [PTIS].[PropertyMastDetails] OFF




INSERT INTO PTIS.TransMast
(
    PropertyId,
    FinanceYearId,
    CalculationType,
    CalculationValue,
    TaxId,
    TaxAmount,
    CreatedBy
)
SELECT 
    p.Id,
    1,
    'RV',
    v.RVValue,
    t.Id,
    round(CAST(v.RVValue * ((t.Id % 10) + 1) / 1234.0 AS DECIMAL(18,2)),00),
    1
FROM PTIS.PropertyMast p
CROSS JOIN PTIS.TaxMaster t
CROSS APPLY
(
    SELECT CAST(4587 + (p.Id * 25) AS DECIMAL(18,2)) AS RVValue
) v
WHERE p.IsActive = 1
AND t.IsActive = 1
AND NOT EXISTS
(
    SELECT 1
    FROM PTIS.TransMast tm
    WHERE tm.PropertyId = p.Id
      AND tm.TaxId = t.Id
      AND tm.FinanceYearId = 1
);




-- INSERT INTO PTIS.TransMastCV
-- (
--     PropertyId,
--     FinanceYearId,
--     CapitalValue,
--     TaxId,
--     TaxAmount,
--     CreatedBy
-- )
-- SELECT 
--     p.Id,
--     1,
--     v.RVValue,
--     t.Id,
--     round(CAST(v.RVValue * ((t.Id % 10) + 1) / 67890.0 AS DECIMAL(18,2)),00),
--     1
-- FROM PTIS.PropertyMast p
-- CROSS JOIN PTIS.TaxMaster t
-- CROSS APPLY
-- (
--     SELECT CAST(5972 + (p.Id * 25) AS DECIMAL(18,2)) AS RVValue
-- ) v
-- WHERE p.IsActive = 1
-- AND t.IsActive = 1
-- AND NOT EXISTS
-- (
--     SELECT 1
--     FROM PTIS.TransMastCV tm
--     WHERE tm.PropertyId = p.Id
--       AND tm.TaxId = t.Id
--       AND tm.FinanceYearId = 1
-- );




-- INSERT INTO PTIS.TransMastRV
-- (
--     PropertyId,
--     FinanceYearId,
--     RateableValue,
--     TaxId,
--     TaxAmount,
--     CreatedBy
-- )
-- SELECT 
--     p.Id,
--     1,
--     v.RVValue,
--     t.Id,
--     round(CAST(v.RVValue * ((t.Id % 10) + 1) / 25978.0 AS DECIMAL(18,2)),00),
--     1
-- FROM PTIS.PropertyMast p
-- CROSS JOIN PTIS.TaxMaster t
-- CROSS APPLY
-- (
--     SELECT CAST(2469 + (p.Id * 25) AS DECIMAL(18,2)) AS RVValue
-- ) v
-- WHERE p.IsActive = 1
-- AND t.IsActive = 1
-- AND NOT EXISTS
-- (
--     SELECT 1
--     FROM PTIS.TransMastRV tm
--     WHERE tm.PropertyId = p.Id
--       AND tm.TaxId = t.Id
--       AND tm.FinanceYearId = 1
-- );



-- INSERT INTO PTIS.TaxPendingDetails
-- (
--     PropertyId,
--     PendingYearId,
--     TaxId,
--     PendingAmount,
--     CreatedBy
-- )
-- SELECT
--     p.Id,
--     y.Id,
--     t.Id,
--     round(CAST(((p.Id * 5) + (t.Id * 11) + (y.Id * 3)) / 100.0 AS DECIMAL(18,2)),00) AS PendingAmount,
--     1
-- FROM PTIS.PropertyMast p
-- CROSS JOIN PTIS.TaxMaster t
-- CROSS JOIN
-- (
--     SELECT TOP 1 Id
--     FROM CORE.YearMaster
--     ORDER BY Id
-- ) y
-- WHERE p.IsActive = 1
-- AND t.IsActive = 1
-- AND NOT EXISTS
-- (
--     SELECT 1
--     FROM PTIS.TaxPendingDetails pd
--     WHERE pd.PropertyId = p.Id
--       AND pd.PendingYearId = y.Id
--       AND pd.TaxId = t.Id
-- );


-- INSERT INTO PTIS.TaxPendingDetailsCV
-- (
--     PropertyId,
--     PendingYearId,
--     TaxId,
--     PendingAmount,
--     CreatedBy
-- )
-- SELECT
--     p.Id,
--     y.Id,
--     t.Id,
--     round(CAST(((p.Id * 7) + (t.Id * 13) + (y.Id * 2)) / 854.0 AS DECIMAL(18,2)),00) AS PendingAmount,
--     1
-- FROM PTIS.PropertyMast p
-- CROSS JOIN PTIS.TaxMaster t
-- CROSS JOIN
-- (
--     SELECT TOP 1 Id
--     FROM CORE.YearMaster
--     ORDER BY Id
-- ) y
-- WHERE p.IsActive = 1
-- AND t.IsActive = 1
-- AND NOT EXISTS
-- (
--     SELECT 1
--     FROM PTIS.TaxPendingDetailsCV pd
--     WHERE pd.PropertyId = p.Id
--       AND pd.PendingYearId = y.Id
--       AND pd.TaxId = t.Id
-- );


-- INSERT INTO PTIS.TaxPendingDetailsRV
-- (
--     PropertyId,
--     PendingYearId,
--     TaxId,
--     PendingAmount,
--     CreatedBy
-- )
-- SELECT
--     p.Id,
--     y.Id,
--     t.Id,
--     round(CAST(((p.Id * 7) + (t.Id * 13) + (y.Id * 2)) / 854.0 AS DECIMAL(18,2)),00) AS PendingAmount,
--     1
-- FROM PTIS.PropertyMast p
-- CROSS JOIN PTIS.TaxMaster t
-- CROSS JOIN
-- (
--     SELECT TOP 1 Id
--     FROM CORE.YearMaster
--     ORDER BY Id
-- ) y
-- WHERE p.IsActive = 1
-- AND t.IsActive = 1
-- AND NOT EXISTS
-- (
--     SELECT 1
--     FROM PTIS.TaxPendingDetailsRV pd
--     WHERE pd.PropertyId = p.Id
--       AND pd.PendingYearId = y.Id
--       AND pd.TaxId = t.Id
-- );



SET IDENTITY_INSERT [PTIS].[PropertyMastOld] ON;
GO

INSERT INTO [PTIS].[PropertyMastOld](
    [Id],
    [OldPropertyNo],
    [OldPartitionNo],
    [OldEgovNo],
    [OldPropertyTypeId],
    [OldALV],
    [OldRV],
    [OldGeneralTax],
    [OldTotalTax],
    [OldZoneNo],
    [OldPlotNo],
    [OldCSN],
    [OldPlotArea],
    [OldConstructionYear],
    [OldAssessmentYear],
    [OldFloor],
    [OldConstructionTypeOfUseId],
    [OldUseType],
    [OldConstructionArea],
    [OldOwnerName],
    [OldOccupierName],
    [OldAddress],
    [OldOwnerNameEnglish],
    [OldOccupierNameEnglish],
    [OldAddressEnglish],
    [NoOfOldToilets],
    [OldTotalRooms],
    [OldSocietyName],
    [OldEmailId],
    [OldParkingAreaSqFt],
    [OldParkingAreaSqMtr],
    [OldAssessmentDate],
    [OldFlatOrShopNumber],
    [OldWing],
    [OldMobileNo],
    [MarkedForDeletion],
    [MarkedForDeletionDate],
    [IsActive],
    [CreatedBy],
    [CreatedDate],
    [UpdatedBy],
    [UpdatedDate]
)
SELECT
    pd.PropertyId AS [Id],
    LEFT(CAST(pd.PropertyNo AS nvarchar(10)), 10) AS [OldPropertyNo],
    LEFT(CAST(pd.PartitionNo AS nvarchar(10)), 10) AS [OldPartitionNo],
    LEFT(CAST(pd.UPICId AS nvarchar(10)), 10) AS [OldEgovNo],
    pd.PropertyTypeId AS [OldPropertyTypeId],
    CAST(NULL AS float) AS [OldALV],
    CAST(NULL AS float) AS [OldRV],
    CAST(NULL AS float) AS [OldGeneralTax],
    CAST(NULL AS float) AS [OldTotalTax],
    LEFT(CAST(pd.TaxZoneId AS nvarchar(20)), 20) AS [OldZoneNo],
    LEFT(CAST(pd.PlotNo AS nvarchar(20)), 20) AS [OldPlotNo],
    LEFT(CAST(pd.CSN AS nvarchar(30)), 30) AS [OldCSN],
    CAST(NULL AS float) AS [OldPlotArea],
    CAST(NULL AS int) AS [OldConstructionYear],
    CAST(NULL AS int) AS [OldAssessmentYear],
    CAST(NULL AS nvarchar(10)) AS [OldFloor],
    CAST(NULL AS nvarchar(7)) AS [OldConstructionTypeOfUseId],
    CAST(NULL AS nvarchar(100)) AS [OldUseType],
    CAST(NULL AS float) AS [OldConstructionArea],
    LEFT(CAST(pd.OwnerName AS nvarchar(1000)), 1000) AS [OldOwnerName],
    LEFT(CAST(pd.OccupierName AS nvarchar(1000)), 1000) AS [OldOccupierName],
    LEFT(CAST(pd.Address AS nvarchar(500)), 500) AS [OldAddress],
    LEFT(CAST(pd.OwnerNameEnglish AS nvarchar(1000)), 1000) AS [OldOwnerNameEnglish],
    LEFT(CAST(pd.OccupierNameEnglish AS nvarchar(1000)), 1000) AS [OldOccupierNameEnglish],
    LEFT(CAST(pd.AddressEnglish AS nvarchar(500)), 500) AS [OldAddressEnglish],
    CAST(NULL AS int) AS [NoOfOldToilets],
    CAST(NULL AS int) AS [OldTotalRooms],
    LEFT(CAST(pd.FlatOrShopName AS nvarchar(300)), 300) AS [OldSocietyName],
    LEFT(CAST(pd.EmailId AS nvarchar(100)), 100) AS [OldEmailId],
    CAST(NULL AS float) AS [OldParkingAreaSqFt],
    CAST(NULL AS float) AS [OldParkingAreaSqMtr],
    CAST(NULL AS datetime) AS [OldAssessmentDate],
    LEFT(CAST(pd.FlatOrShopNo AS nvarchar(50)), 50) AS [OldFlatOrShopNumber],
    CAST(NULL AS nvarchar(20)) AS [OldWing],
    LEFT(CAST(pd.MobileNo AS varchar(13)), 13) AS [OldMobileNo],
    pd.MarkedForDeletion AS [MarkedForDeletion],
    CAST(NULL AS datetime) AS [MarkedForDeletionDate],
    pd.IsActive AS [IsActive],
    pd.CreatedBy AS [CreatedBy],
    pd.CreatedDate AS [CreatedDate],
    pd.UpdatedBy AS [UpdatedBy],
    pd.UpdatedDate AS [UpdatedDate]
FROM (VALUES
    (549357, N'1', N'10', N'', 41, N'MM1100100000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'à¤¶à¥à¤°à¥€', N'LODHA AMARA BUILDING', NULL, N'', N'', N'PARKING  13 FLOOR ', N'Lodha Amara Kolshet Road Thane West', N'7, Kolshet Rd, Lodha Amara, Kolshet Industrial Area, Thane West, Mumbai, Thane, Maharashtra 400607, India ', N'', N'', NULL, N'Mr', N'.', NULL, N'', N'', N'', N'', N'7, Kolshet Rd, Lodha Amara, Kolshet Industrial Area, Thane West, Mumbai, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 60, CAST(N'2025-06-28T11:51:10.530' AS DateTime)),

    (549439, N'1', N'15', N'', 12, N'MM1100150000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'The Holder', N'Smt', N'', N'', N'', N'SAI KRUPA CHAWL VARCHA GAON, KOLSHET, THANE-400607', N'6XQR+6M9, Kolshet Rd, Kolshet, Thane West, Thane, Maharashtra 400607, India ', N'9222122264', N'', NULL, N'', N'The Holder', N'', N'', N'', N'.', N'', N'6XQR+6M9, Kolshet Rd, Kolshet, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-07-30T18:07:14.610' AS DateTime)),

    (549441, N'1', N'16', N'', 12, N'MM1100160000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'The Holder', N'Smt', N'', N'', N'', N'SAI KRUPA CHAWL VARCHA GAON, KOLSHET, THANE-400607', N'6XQR+6M9, Kolshet Rd, Kolshet, Thane West, Thane, Maharashtra 400607, India ', N'8082028615', N'', NULL, N'', N'The Holder', N'', N'', N'', N'', N'', N'6XQR+6M9, Kolshet Rd, Kolshet, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-07-30T18:28:17.217' AS DateTime)),

   (549442, N'1', N'17', N'', 12, N'MM1100170000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'The Holder', N'Mr', N'', N'', N'', N'SAI KRUPA CHAWL VARCHA GAON, KOLSHET, THANE-400607', N'6XQR+6M9, Kolshet Rd, Kolshet, Thane West, Thane, Maharashtra 400607, India ', N'7208357449', N'', NULL, N'', N'The Holder', N'', N'', N'', N'.', N'', N'6XQR+6M9, Kolshet Rd, Kolshet, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-07-30T18:33:57.860' AS DateTime)),
 
 (549445, N'1',  N'18', N'', 12, N'MM1100180000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'The Holder', N'Mr', N'', N'', N'', N'SAI KRUPA CHAWL,VARCHA GAON, KOLSHET, THANE-400607', N'6XQR+6M9, Kolshet Rd, Kolshet, Thane West, Thane, Maharashtra 400607, India ', N'9833529588', N'', NULL, N'', N'The Holder', N'', N'', N'', N'', N'', N'6XQR+6M9, Kolshet Rd, Kolshet, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-07-30T18:40:21.360' AS DateTime)),
                
 (549446, N'1',  N'19', N'', 12, N'MM1100190000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'The Holder', N'Mr', N'PRESENT OCCUPIER :- AJAY RAMPAL ROHANDIYA', N'', N'', N'SAI KRUPA CHAWL,VARCHA GAON, KOLSHET, THANE-400607', N'6XQR+6M9, Kolshet Rd, Kolshet, Thane West, Thane, Maharashtra 400607, India ', N'9967768667', N'', NULL, N'', N'The Holder', N'', N'', N'', N'', N'', N'6XQR+6M9, Kolshet Rd, Kolshet, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-08-19T15:12:44.047' AS DateTime)),
                
 (549448, N'1',  N'20', N'', 12, N'MM1100200000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'The Holder', N'Mr', N'', N'', N'', N'SAI KRUPA CHAWL,VARCHA GAON, KOLSHET, THANE-400607', N'1, Gamdevi, Marol, Andheri East, Mumbai, Thane, Maharashtra 400059, India ', N'9004814808', N'', NULL, N'', N'The Holder', N'', N'', N'', N'', N'', N'1, Gamdevi, Marol, Andheri East, Mumbai, Thane, Maharashtra 400059, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 73, CAST(N'2025-08-19T16:58:57.933' AS DateTime)),
                
 (549451, N'1',  N'21', N'', 12, N'MM1100210000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'The Holder', N'Smt', N'', N'', N'', N'SAI KRUPA CHAWL,VARCHA GAON, KOLSHET, THANE-400607', N'1, Gamdevi, Marol, Andheri East, Mumbai, Thane, Maharashtra 400059, India ', N'9322757603', N'', NULL, N'', N'The Holder', N'', N'', N'', N'', N'', N'1, Gamdevi, Marol, Andheri East, Mumbai, Thane, Maharashtra 400059, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-08-19T15:29:45.997' AS DateTime)),
                
 (549452, N'1',  N'22', N'', 12, N'MM1100220000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'The Holder', N'Mr', N'', N'', N'', N'SAI KRUPA CHAWL,VARCHA GAON, KOLSHET, THANE-400607', N'1, Gamdevi, Marol, Andheri East, Mumbai, Thane, Maharashtra 400059, India ', N'7738632925', N'', NULL, N'', N'The Holder', N'', N'', N'', N'', N'', N'1, Gamdevi, Marol, Andheri East, Mumbai, Thane, Maharashtra 400059, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 73, CAST(N'2025-08-14T17:33:14.693' AS DateTime)),
                
 (549453, N'1',  N'23', N'', 12, N'MM1100230000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'The Holder', N'Mr', N'', N'', N'', N'SAI KRUPA CHAWL,VARCHA GAON, KOLSHET, THANE-400607', N'1, Gamdevi, Marol, Andheri East, Mumbai, Thane, Maharashtra 400059, India ', N'9869737593', N'', NULL, N'', N'The Holder', N'', N'', N'', N'', N'', N'1, Gamdevi, Marol, Andheri East, Mumbai, Thane, Maharashtra 400059, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-08-19T15:48:04.117' AS DateTime)),
                
 (550296, N'1', N'19', N'', 5, N'MM0100190000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'The Holder', N'Mr', N'ABAHY BRIJBIHARI SHARMA & NISTHA ABHAY SHARMA', N'', N'Swasth Sankalpan', N'BUNGLOW NO. 3 OPP. DEV DARSHAN SOC. PHASE1, G.B. ROAD , THANE ,WEST.', N'S-1, Dongripada, Thane West, Thane, Maharashtra 400607, India ', N'9833222706', N'', NULL, N'', N'The Holder', N'', N'', N'', N'Swasth Sankalpan', N'', N'S-1, Dongripada, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
                
 (550299, N'1', N'22', N'', 12, N'MM0100220000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'The Holder', N'Mr', N'SMT.  SHILA VILAS MANIK', N'', N'Alder Care', N'Near Devdarshan Phase 1 Bilding Dongripada Ghodbunder Road. Thane West', N'Dosti Imperia, 7, Ghodbunder Rd, Manpada, Thane West, Thane, Maharashtra 400607, India ', N'8454970354', N'', NULL, N'', N'The Holder', N'', NULL, NULL, N'', N'', N'Dosti Imperia, 7, Ghodbunder Rd, Manpada, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
                
 (550300, N'1', N'23', N'', 1, N'MM0100230000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'The Holder', N'Mr', N'SHRI. AJAY TAMHANE AND SOU. JAYSHREETAMHANE', N'', N'', N'KAVESAR', N'Dosti Imperia, 7, Ghodbunder Rd, Manpada, Thane West, Thane, Maharashtra 400607, India ', N'9930593675', N'', NULL, N'', N'The Holder', N'', NULL, NULL, N'', N'', N'Dosti Imperia, 7, Ghodbunder Rd, Manpada, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
                
 (550304, N'1', N'24', N'', 1, N'MM0100240000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'The Holder', N'Mr', N'SALONA BAINS JOSHI', N'', N'Uc Kindies', N'Near Devdarshan Phase 1 Bilding Dongripada Ghodbunder Road. Thane West', N'Dosti Imperia, 7, Ghodbunder Rd, Manpada, Thane West, Thane, Maharashtra 400607, India ', N'9819156930', N'', NULL, N'', N'The Holder', N'', NULL, NULL, N'', N'', N'Dosti Imperia, 7, Ghodbunder Rd, Manpada, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
                
 (550514, N'1', N'41', N'', 29, N'MM0100410000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'THE HOLDER', N'Mr', N'THE HOLDER', N'', N'Sidhivinayak', N'NEAR HOTEL JALALA GHODBANDAR ROAD . , THANE-400607', N'Vijay Galaxy Vijay Galaxy-1, 1, Wagbil Rd, Anu Nagar, Vijay Nagari, Thane West, Thane, Maharashtra 400607, India ', N'9987631663', N'', NULL, N'', N'', N'', N'Dilip Radheshyam Chaubey', NULL, N'', N'', N'Vijay Galaxy Vijay Galaxy-1, 1, Wagbil Rd, Anu Nagar, Vijay Nagari, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
                
 (550516, N'1', N'42', N'', 12, N'MM0100420000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'The Holder', N'Mr', NULL, NULL, N'Stayl Your Spase', N' GALA NO.4, RADHESHYAM CHAWL, WAGHBIL NAKA, NR. DALAL COMPANY, G.B. ROAD, THANE', N'7X3F+73M, Wagbil Rd, Anu Nagar, Vijay Nagari, Thane West, Thane, Maharashtra 400607, India ', N'8828177466', N'', NULL, N'', N'The Holder', N'', NULL, NULL, N'', N'', N'7X3F+73M, Wagbil Rd, Anu Nagar, Vijay Nagari, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
                
 (550722, N'1', N'85', N'', 12, N'MM0100850000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'- KALLU SURAJ GAUD KALLU SURAJ GAUD ', N'', N'', N'', N'', N'Near SANGHAVI HILLS .D MART  ANAND NAGER G B ROAD THANE WEST', N'1, Ghodbunder Rd, Sanghavi Hills, Parkwoods, Thane West, Mumbai, Maharashtra 400607, India ', N'7738869965', N'', NULL, N'', N'', N'', N'', N'', N'', N'', N'1, Ghodbunder Rd, Sanghavi Hills, Parkwoods, Thane West, Mumbai, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-08-19T12:01:03.007' AS DateTime)),
                
 (550726, N'1', N'85', N'1', 12, N'MM0100850001', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'The Holder', N'Mr', N'The Holder', N'', N'', N'Near SANGHAVI HILLS .D MART ANAND NAGER G B ROAD THANE WEST', NULL, N'', N'', NULL, N'', N'The Holder', NULL, N'', N'', N'', N'', NULL, 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-08-19T12:13:12.973' AS DateTime)),
                
 (550727, N'1', N'85', N'2', 12, N'MM0100850002', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'The Holder', N'Mr', N'The Holder ', N'', N'', N'Near SANGHAVI HILLS .D MART  ANAND NAGER G B ROAD THANE WEST', NULL, N'', N'', NULL, N'', N'The Holder', NULL, N'', N'', N'', N'', NULL, 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-08-19T12:31:28.133' AS DateTime)),
                
 (550728, N'1', N'85', N'3', 12, N'MM0100850003', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'The Holder', N'Mr', N'The Holder', N'', N'', N'Near SANGHAVI HILLS .D MART ANAND NAGER G B ROAD THANE WEST', NULL, N'', N'', NULL, N'', N'The Holder', NULL, N'', N'', N'', N'', NULL, 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-08-19T12:31:50.063' AS DateTime)),
 
 (552371, N'1', N'1', N'', 69, NULL, 0, N'', NULL, N'', 6, NULL, NULL, N'Mr', N'NAGNATH APARTMENT', N'', N'THE HOLDER', N'', N'.', N'NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', N'', N'', NULL, N'', N'.', N'', N'', N'', N'.', N'', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 60, CAST(N'2025-06-26T12:55:31.150' AS DateTime)),
 
 (552372, N'1', N'1', N'A', 69, NULL, 0, N'', NULL, N'', 6, NULL, NULL, N'à¤¶à¥à¤°à¥€', N'NAGNATH APARTMENT', NULL, N'THE HOLDER', N'', N'.', N'WING -B, NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', N'', N'', NULL, N'Mr', N'.', NULL, N'', N'', N'', N'', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 60, CAST(N'2025-06-26T12:58:39.177' AS DateTime)),
 
 (552373, N'1', N'1', N'S', 69, NULL, 0, N'', NULL, N'', 6, NULL, NULL, N'', N'NAGNATH APARTMENT', NULL, N'THE HOLDER', N'', N'.', N'WING -S, NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', N'', N'', NULL, N'', N'', NULL, N'', N'', N'', N'', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 60, CAST(N'2025-06-26T12:58:05.040' AS DateTime)),
 
 (552374, N'1', N'1', N'A1', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'NAGNATH APARTMENT', N'', N'THE HOLDER', N'1', N'', N'WING-B, FLAT NO-1, NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', N'9004564479', N'', NULL, N'', N'The Holder', NULL, N'', N'1', N'', N'Wing-B, Flat No-1, NAGNATH APARTMENT MASOBA devnagar Madhavi Bangla Road EKVIRA APARTMENT NEAR', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 55, CAST(N'2025-06-14T15:42:57.910' AS DateTime)),
 
 (552375, N'1', N'1', N'A2', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'NAGNATH APARTMENT', N'Mr', N'THE HOLDER', N'101', N'', N'WING-B, FLAT NO-101, NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', N'9819482978', N'', NULL, N'', N'The Holder', NULL, N'', N'101', N'', N'Wing-B, Flat No-101, NAGNATH APARTMENT MASOBA devnagar Madhavi Bangla Road EKVIRA APARTMENT NEAR', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (552376, N'1', N'1', N'A3', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'NAGNATH APARTMENT', N'Mr', N'THE HOLDER', N'201', N'', N'WING-B, FLAT NO-201, NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', N'8975378988', N'', NULL, N'', N'The Holder', NULL, N'', N'201', N'', N'Wing-B, Flat No-201, NAGNATH APARTMENT MASOBA devnagar Madhavi Bangla Road EKVIRA APARTMENT NEAR', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (552377, N'1', N'1', N'A4', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'NAGNATH APARTMENT', N'Mr', N'THE HOLDER', N'301', N'', N'WING-B, FLAT NO-301, NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', N'8652579778', N'', NULL, N'', N'The Holder', NULL, N'', N'301', N'', N'Wing-B, Flat No-301, NAGNATH APARTMENT MASOBA devnagar Madhavi Bangla Road EKVIRA APARTMENT NEAR', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (552378, N'1', N'1', N'A5', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'NAGNATH APARTMENT', N'Mr', N'THE HOLDER', N'401', N'', N'WING-B, FLAT NO-401, NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', N'7977590750', N'', NULL, N'', N'The Holder', NULL, N'', N'401', N'', N'Wing-B, Flat No-401, NAGNATH APARTMENT MASOBA devnagar Madhavi Bangla Road EKVIRA APARTMENT NEAR', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (552379, N'1', N'1', N'A6', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'NAGNATH APARTMENT', N'Mr', N'THE HOLDER', N'2', N'', N'WING-B, FLAT NO-2, NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', N'9321443608', N'', NULL, N'', N'The Holder', NULL, N'', N'2', N'', N'WING-B, FLAT NO-2, NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (552380, N'1', N'1', N'A7', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'NAGNATH APARTMENT', N'Mr', N'THE HOLDER', N'102', N'', N'WING-B, FLAT NO-102, NAGNATH APARTMENT MASOBA DEVNAGAR MADHAVI BANGLA ROAD,DIVA-412421', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', N'9769270391', N'', NULL, N'', N'The Holder', NULL, N'', N'102', N'', N'Wing-B, Flat No-102, NAGNATH APARTMENT MASOBA devnagar Madhavi Bangla Road EKVIRA APARTMENT NEAR', N'53M6+V78, Datiwali Gaon, Thane, Maharashtra 400612, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (552994, N'1', N'1', N'', 69, NULL, 0, N'', NULL, N'', 6, NULL, NULL, N'Mr', N'SUKHIYA APARTMENT', N'', N'THE HOLDER', N'', N'.', N'SUKHIYA APARTMENT,KALYAN PHATA DAIGHAR GAON ROAD BESIDE PG,SHIL-421204', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', N'9821201794', N'', NULL, N'', N'.', N'', N'', N'', N'.', N'', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-06-05T18:00:58.173' AS DateTime)),
 
 (553033, N'1', N'1', N'A', 12, NULL, 0, N'', NULL, N'', 6, NULL, NULL, NULL, N'SUKHIYA APARTMENT', NULL, N'THE HOLDER', NULL, NULL, N'WING -A, SUKHIYA APARTMENT,KALYAN PHATA DAIGHAR GAON ROAD BESIDE PG,SHIL-421204', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', N'9821201794', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, N'Wing -A, Sukhiya Apartment,Kalyan Phata Daighar Gaon Road Beside Pg,Shil', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (553034, N'1', N'1', N'S', 13, NULL, 0, N'', NULL, N'', 6, NULL, NULL, N'à¤¶à¥à¤°à¥€', N'SUKHIYA APARTMENT', NULL, N'THE HOLDER', N'', N'.', N'WING -S, SUKHIYA APARTMENT,KALYAN PHATA DAIGHAR GAON ROAD BESIDE PG,SHIL-421204', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', N'9821201794', N'', NULL, N'Mr', N'.', NULL, N'', N'', N'', N'Wing -S, Sukhiya Apartment,Kalyan Phata Daighar Gaon Road Beside Pg,Shil', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 70, CAST(N'2025-09-12T16:34:09.020' AS DateTime)),
 
 (553035, N'1', N'1', N'A1', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'SUKHIYA APARTMENT', N'Mr', N'THE HOLDER', N'1', N'', N'WING-A, FLAT NO-1, SUKHIYA APARTMENT,KALYAN PHATA DAIGHAR GAON ROAD BESIDE PG,SHIL-421204', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', N'9224555542', N'', NULL, N'', N'The Holder', NULL, N'', N'1', N'', N'Wing-A, Flat No-1, Sukhiya Apartment,Kalyan Phata Daighar Gaon Road Beside Pg,Shil', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 90, CAST(N'2025-07-07T12:27:56.023' AS DateTime)),
 
 (553036, N'1', N'1', N'A2', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'', N'SUKHIYA APARTMENT', NULL, N'THE HOLDER', N'101', N'', N'WING-A, FLAT NO-101, SUKHIYA APARTMENT,KALYAN PHATA DAIGHAR GAON ROAD BESIDE PG,SHIL-421204', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', N'8355971319', N'', NULL, N'', N'The Holder', NULL, N'', N'101', N'', N'Wing-A, Flat No-101, Sukhiya Apartment,Kalyan Phata Daighar Gaon Road Beside Pg,Shil', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-06-12T16:10:18.877' AS DateTime)),
 
 (553037, N'1', N'1', N'A3', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, NULL, N'SUKHIYA APARTMENT', NULL, N'THE HOLDER', N'201', NULL, N'WING-A, FLAT NO-201, SUKHIYA APARTMENT,KALYAN PHATA DAIGHAR GAON ROAD BESIDE PG,SHIL-421204', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', N'9833116002', NULL, NULL, NULL, N'The Holder', NULL, NULL, N'201', NULL, N'Wing-A, Flat No-201, Sukhiya Apartment,Kalyan Phata Daighar Gaon Road Beside Pg,Shil', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (553038, N'1', N'1', N'A4', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, NULL, N'SUKHIYA APARTMENT', NULL, N'THE HOLDER', N'301', NULL, N'WING-A, FLAT NO-301, SUKHIYA APARTMENT,KALYAN PHATA DAIGHAR GAON ROAD BESIDE PG,SHIL-421204', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', N'9821201794', NULL, NULL, NULL, N'The Holder', NULL, NULL, N'301', NULL, N'Wing-A, Flat No-301, Sukhiya Apartment,Kalyan Phata Daighar Gaon Road Beside Pg,Shil', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (553039, N'1', N'1', N'A5', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, NULL, N'SUKHIYA APARTMENT', NULL, N'THE HOLDER', N'401', NULL, N'WING-A, FLAT NO-401, SUKHIYA APARTMENT,KALYAN PHATA DAIGHAR GAON ROAD BESIDE PG,SHIL-421204', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', N'9892039450', NULL, NULL, NULL, N'The Holder', NULL, NULL, N'401', NULL, N'Wing-A, Flat No-401, Sukhiya Apartment,Kalyan Phata Daighar Gaon Road Beside Pg,Shil', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (553040, N'1', N'1', N'A6', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, NULL, N'SUKHIYA APARTMENT', NULL, N'THE HOLDER', N'501', NULL, N'WING-A, FLAT NO-501, SUKHIYA APARTMENT,KALYAN PHATA DAIGHAR GAON ROAD BESIDE PG,SHIL-421204', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', N'9821201794', NULL, NULL, NULL, N'The Holder', NULL, NULL, N'501', NULL, N'Wing-A, Flat No-501, Sukhiya Apartment,Kalyan Phata Daighar Gaon Road Beside Pg,Shil', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (553041, N'1', N'1', N'A7', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'', N'SUKHIYA APARTMENT', NULL, N'THE HOLDER', N'2', N'', N'WING-A, FLAT NO-2, SUKHIYA APARTMENT,KALYAN PHATA DAIGHAR GAON ROAD BESIDE PG,SHIL-421204', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', N'9821201794', N'', NULL, N'', N'The Holder', NULL, N'', N'2', N'', N'Wing-A, Flat No-2, Sukhiya Apartment,Kalyan Phata Daighar Gaon Road Beside Pg,Shil', N'42VX+8G3, Kalyan Phata Cir, Shilphata, Navi Mumbai, Thane, Maharashtra 421204, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-06-12T16:06:18.700' AS DateTime)),
 
 (556004, N'1', N'1', N'', 69, NULL, 0, N'', NULL, N'', 6, NULL, NULL, N'à¤¶à¥à¤°à¥€', N'PRADIP DATTATRAY KINI AND HANUMAN RAMCHANDRA KINI', N'', N'', N'', N'.', N'MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,KHAREGAON-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', N'', N'', NULL, N'Mr', N'.', N'', N'', N'', N'.', N'', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 55, CAST(N'2025-07-21T20:24:38.123' AS DateTime)),
 
 (556008, N'1', N'1', N'A', 69, NULL, 0, N'', NULL, N'', 6, NULL, NULL, N'à¤¶à¥à¤°à¥€', N'PRADIP DATTATRAY KINI AND HANUMAN RAMCHANDRA KINI', NULL, N'', N'', N'.', N'Wing -A, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK , Kharegaon-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', N'', N'', NULL, N'Mr', N'.', NULL, N'', N'', N'', N'Wing -A, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,à¤–à¤¾à¤°à¥‡à¤—à¤¾à¤µ-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 69, CAST(N'2025-07-23T18:04:54.223' AS DateTime)),
 
 (556010, N'1', N'1', N'A1', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'PRADIP DATTATRAY KINI AND HANUMAN RAMCHANDRA KINI', N'', N'MANDAR CONSTRUCTION AND DEVLOPERS .LLP', N'101', N'', N'Wing-A, Flat No-101, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,Kharegaon-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', N'9833187777', N'mandarkeni@yahoo.com', NULL, N'', N'.', NULL, N'', N'101', N'', N'Wing-A, Flat No-101, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,à¤–à¤¾à¤°à¥‡à¤—à¤¾à¤µ-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 58, CAST(N'2025-08-08T13:13:55.817' AS DateTime)),
 
 (556011, N'1', N'1', N'A2', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'PRADIP DATTATRAY KINI AND HANUMAN RAMCHANDRA KINI', N'', N'MANDAR CONSTRUCTION AND DEVLOPERS .LLP', N'201', N'', N'Wing-A, Flat No-201, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,Kharegaon-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', N'9833187777', N'mandarkeni@yahoo.com', NULL, N'', N'.', NULL, N'', N'201', N'', N'Wing-A, Flat No-201, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,à¤–à¤¾à¤°à¥‡à¤—à¤¾à¤µ-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (556012, N'1', N'1', N'A3', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'PRADIP DATTATRAY KINI AND HANUMAN RAMCHANDRA KINI', N'', N'MANDAR CONSTRUCTION AND DEVLOPERS .LLP', N'301', N'', N'Wing-A, Flat No-301, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,Kharegaon-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', N'9833187777', N'mandarkeni@yahoo.com', NULL, N'', N'.', NULL, N'', N'301', N'', N'Wing-A, Flat No-301, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,à¤–à¤¾à¤°à¥‡à¤—à¤¾à¤µ-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 (556013, N'1', N'1', N'A4', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'PRADIP DATTATRAY KINI AND HANUMAN RAMCHANDRA KINI', N'', N'MANDAR CONSTRUCTION AND DEVLOPERS .LLP', N'401', N'', N'Wing-A, Flat No-401, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,Kharegaon-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', N'9833187777', N'mandarkeni@yahoo.com', NULL, N'', N'.', NULL, N'', N'401', N'', N'Wing-A, Flat No-401, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,à¤–à¤¾à¤°à¥‡à¤—à¤¾à¤µ-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 55, CAST(N'2025-07-03T20:30:13.697' AS DateTime)),
 
 (556014, N'1', N'1', N'A5', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'PRADIP DATTATRAY KINI AND HANUMAN RAMCHANDRA KINI', N'', N'MANDAR CONSTRUCTION AND DEVLOPERS .LLP', N'501', N'', N'Wing-A, Flat No-501, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,Kharegaon-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', N'9833187777', N'mandarkeni@yahoo.com', NULL, N'', N'.', NULL, N'', N'501', N'', N'Wing-A, Flat No-501, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,à¤–à¤¾à¤°à¥‡à¤—à¤¾à¤µ-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (556015, N'1', N'1', N'A6', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'PRADIP DATTATRAY KINI AND HANUMAN RAMCHANDRA KINI', N'Mr', N'MANDAR CONSTRUCTION AND DEVLOPERS .LLP', N'601', N'', N'Wing-A, Flat No-601, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,Kharegaon-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', N'9833187777', N'mandarkeni@yahoo.com', NULL, N'', N'.', NULL, N'', N'601', N'', N'Wing-A, Flat No-601, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,à¤–à¤¾à¤°à¥‡à¤—à¤¾à¤µ-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (556016, N'1', N'1', N'A7', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'PRADIP DATTATRAY KINI AND HANUMAN RAMCHANDRA KINI', N'', N'MANDAR CONSTRUCTION AND DEVLOPERS .LLP', N'701', N'', N'Wing-A, Flat No-701, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,Kharegaon-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', N'9833187777', N'mandarkeni@yahoo.com', NULL, N'', N'.', NULL, N'', N'701', N'', N'Wing-A, Flat No-701, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,à¤–à¤¾à¤°à¥‡à¤—à¤¾à¤µ-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (556017, N'1', N'1', N'A8', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'PRADIP DATTATRAY KINI AND HANUMAN RAMCHANDRA KINI', N'', N'MANDAR CONSTRUCTION AND DEVLOPERS .LLP', N'801', N'', N'Wing-A, Flat No-801, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,Kharegaon-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', N'9833187777', N'mandarkeni@yahoo.com', NULL, N'', N'.', NULL, N'', N'801', N'', N'Wing-A, Flat No-801, MAPLE PARADISE BUILDING,DATTAWADI ,60 FEET ROAD ,OPPOSITE SAYA PARK ,à¤–à¤¾à¤°à¥‡à¤—à¤¾à¤µ-400605', N'6X4W+VFH, Kharegaon, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (560660, N'1', N'3', N'A1', 12, NULL, 0, NULL, NULL, NULL, 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'101', NULL, N'Flat No-101, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'101', NULL, N'Flat No-101, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (560661, N'1', N'3', N'A2', 12, NULL, 0, NULL, NULL, NULL, 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'201', NULL, N'Flat No-201, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'201', NULL, N'Flat No-201, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (560662, N'1', N'3', N'A3', 12, NULL, 0, NULL, NULL, NULL, 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'301', NULL, N'Flat No-301, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'301', NULL, N'Flat No-301, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (560663, N'1', N'3', N'A4', 12, NULL, 0, NULL, NULL, NULL, 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'401', NULL, N'Flat No-401, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'401', NULL, N'Flat No-401, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (560664, N'1', N'3', N'A5', 12, NULL, 0, NULL, NULL, NULL, 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'501', NULL, N'Flat No-501, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'501', NULL, N'Flat No-501, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (560665, N'1', N'3', N'A6', 12, NULL, 0, NULL, NULL, NULL, 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'601', NULL, N'Flat No-601, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'601', NULL, N'Flat No-601, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (560666, N'1', N'3', N'A7', 12, NULL, 0, NULL, NULL, NULL, 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'701', NULL, N'Flat No-701, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'701', NULL, N'Flat No-701, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (560667, N'1', N'3', N'A8', 12, NULL, 0, NULL, NULL, NULL, 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'102', NULL, N'Flat No-102, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'102', NULL, N'Flat No-102, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (560668, N'1', N'3', N'A9', 12, NULL, 0, NULL, NULL, NULL, 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'202', NULL, N'Flat No-202, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'202', NULL, N'Flat No-202, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (560669, N'1', N'3', N'A10', 12, NULL, 0, NULL, NULL, NULL, 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'302', NULL, N'Flat No-302, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'302', NULL, N'Flat No-302, Baban kar Laat hight Devi chapada Ambedkar Nagar Vitawa', N'Shop No 4, Priyanka Paradise, Shop No 4, Vitawa, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (576936, N'1', N'1', N'', 69, NULL, 0, N'', NULL, N'', 6, NULL, NULL, N'à¤¶à¥à¤°à¥€', N'SHREE HARI HIGHTS', N'', N'THE HOLDER', N'', N'.', N'SHREE HARI HIGHTS, OPPOSITE AMRUT PARK SOCIETY, SHSHTRI NAGAR, KALWA(W).-400605', N'5XXQ+HG7, Shastri Nagar, Manisha Nagar, Kalwa, Thane, Maharashtra 400605, India ', N'9892805400', N'', NULL, N'Mr', N'.', N'', N'', N'', N'', N'', N'5XXQ+HG7, Shastri Nagar, Manisha Nagar, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 75, CAST(N'2025-07-14T17:36:05.770' AS DateTime)),
 
 (576939, N'1', N'2', N'', 69, NULL, 0, N'', NULL, N'', 6, NULL, NULL, N'à¤¶à¥à¤°à¥€', N'SAWALARAM HEIGHTS WING A&B', N'', N'THE HOLDER', N'', N'.', N'SAWALARAM HEIGHTS,MANISHA NAGAR RD, SHASTRI NAGAR, KALWA,THANE-400605', NULL, N'9867146697', N'', NULL, N'Mr', N'.', N'', N'', N'', N'.', N'', NULL, 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 74, CAST(N'2025-07-12T11:05:38.767' AS DateTime)),
 
 (577185, N'1', N'3', N'', 69, NULL, 0, N'', NULL, N'', 6, NULL, NULL, N'Mr', N'SALUBAI NIWAS', N'', N'THE HOLDER', N'', N'.', N'SALUBAI NIWAS, JAMA MASJIT ROAD, KALWA NAKA, KALWA (P)THANE.-400605', N'Bala Mhatre Building, Kalwa West, Budhaji Nagar, Kalwa, Thane, Maharashtra 400605, India ', N'9819824232', N'', NULL, N'', N'', N'', N'', N'', N'', N'', N'Bala Mhatre Building, Kalwa West, Budhaji Nagar, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 78, CAST(N'2025-07-09T17:09:15.410' AS DateTime)),
 
 (577437, N'1', N'4', N'', 69, NULL, 0, N'', NULL, N'', 6, NULL, NULL, N'Mr', N'GANESH KRUPA CO. OP. HOUSING SOCIETY', N'', N'THE HOLDER', N'', N'.', N'GANESH KRUPA, THAKUR CHAUK, MUMBAI-PUNE ROAD, KALWA, THANE-400605', N'401 Dhanalaxmi CHS, Kalwa - Kharigaon Road, Kumbhar Aali, Kalwa West, Budhaji Nagar, Kalwa, Thane, Maharashtra 400605, India ', N'7738709030', N'', NULL, N'', N'', N'', N'', N'', N'.', N'', N'401 Dhanalaxmi CHS, Kalwa - Kharigaon Road, Kumbhar Aali, Kalwa West, Budhaji Nagar, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 77, CAST(N'2025-07-15T17:12:14.963' AS DateTime)),
 
 (577538, N'1', N'5', N'', 69, NULL, 0, N'', NULL, N'', 6, NULL, NULL, N'Mr', N'PARVATI VILLA', N'', N'THE HOLDER', N'', N'.', N'PARVATI VILLA BUILDING, NEAR PRINCE ELECTRONICS, KUMBHAR ALI, KALWA, THANE-400605', N'9, Station Rd, Kalwa West, Budhaji Nagar, Thane East, Mumbai, Thane, Maharashtra 400605, India ', N'9833123321', N'', NULL, N'', N'', N'', N'', N'', N'', N'', N'9, Station Rd, Kalwa West, Budhaji Nagar, Thane East, Mumbai, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 75, CAST(N'2025-07-14T17:35:03.773' AS DateTime)),
 
 (577957, N'1', N'7', N'', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Smt', N'The Holder', N'Smt', N'Sunita Ramnath Tandel', N'', N'Riddhesh Bunglow', N'Riddhesh Bunglow,Near Prince Electronics, KumbhaAli, Kalwa West,Thane.', N'5XWR+93F, Kumbhar Ln, Sudama Nagar, Budhaji Nagar, Kalwa, Thane, Maharashtra 400605, India ', N'9967488844', N'', NULL, N'', N'', N'', N'', N'', N'Riddhesh Bunglow', N'', N'5XWR+93F, Kumbhar Ln, Sudama Nagar, Budhaji Nagar, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 94, CAST(N'2025-09-04T10:19:52.800' AS DateTime)),
 
 (579097, N'1', N'1', N'A', 69, NULL, 0, N'', NULL, N'', 6, NULL, NULL, NULL, N'SHREE HARI HIGHTS', NULL, N'THE HOLDER', NULL, NULL, N'WING -A, SHREE HARI HIGHTS, OPPOSITE AMRUT PARK SOCIETY, SHSHTRI NAGAR, KALWA(W).-400605', N'5XXQ+HG7, Shastri Nagar, Manisha Nagar, Kalwa, Thane, Maharashtra 400605, India ', NULL, N'', NULL, NULL, NULL, NULL, NULL, NULL, NULL, N'', N'5XXQ+HG7, Shastri Nagar, Manisha Nagar, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (579098, N'1', N'1', N'S', 13, NULL, 0, N'', NULL, N'', 6, NULL, NULL, N'à¤¶à¥à¤°à¥€', N'SHREE HARI HIGHTS', NULL, N'THE HOLDER', N'', N'.', N'WING -S, SHREE HARI HIGHTS, OPPOSITE AMRUT PARK SOCIETY, SHSHTRI NAGAR, KALWA(W).-400605', N'5XXQ+HG7, Shastri Nagar, Manisha Nagar, Kalwa, Thane, Maharashtra 400605, India ', N'', N'', NULL, N'Mr', N'.', NULL, N'', N'', N'', N'', N'5XXQ+HG7, Shastri Nagar, Manisha Nagar, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 70, CAST(N'2025-09-03T13:26:25.643' AS DateTime)),
 
 (579099, N'1', N'1', N'A1', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'', N'SHRI HARI HIGHTS', NULL, N'THE HOLDER', N'1', N'', N'WING-A, FLAT NO-1, SHREE HARI HIGHTS, OPPOSITE AMRUT PARK SOCIETY, SHSHTRI NAGAR, KALWA(W).-400605', N'5XXQ+HG7, Shastri Nagar, Manisha Nagar, Kalwa, Thane, Maharashtra 400605, India ', N'9867284101', N'', NULL, N'', N'The Holder', NULL, N'', N'1', N'', N'Wing-A, Flat No-1, Shree Hari Hights, Opposite Amrut Park Society, Shshtri Nagar, Kalwa(W).', N'5XXQ+HG7, Shastri Nagar, Manisha Nagar, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 65, CAST(N'2025-07-01T12:52:29.307' AS DateTime)),
 
 (579100, N'1', N'1', N'A2', 12, NULL, 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'', N'SHRI HARI HIGHTS', NULL, N'THE HOLDER', N'101', N'', N'WING-A, FLAT NO-101, SHREE HARI HIGHTS, OPPOSITE AMRUT PARK SOCIETY, SHSHTRI NAGAR, KALWA(W).-400605', N'5XXQ+HG7, Shastri Nagar, Manisha Nagar, Kalwa, Thane, Maharashtra 400605, India ', N'8828309595', N'', NULL, N'', N'The Holder', NULL, N'', N'101', N'', N'Wing-A, Flat No-101, Shree Hari Hights, Opposite Amrut Park Society, Shshtri Nagar, Kalwa(W).', N'5XXQ+HG7, Shastri Nagar, Manisha Nagar, Kalwa, Thane, Maharashtra 400605, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 65, CAST(N'2025-07-01T13:01:02.627' AS DateTime)),
 
 (599038, N'1', N'1', N'', 152, N'MM1300010000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'The Holder', N'Mr', N'GROVERS PVT.LTD.', N'', N'', N'Near 3 Manorama Nagar Kolshet Road Thane West', N'3, Manorma Nagar Rd, Sambhaji Nagar, Manorama Nagar, Thane West, Mumbai, Thane, Maharashtra 400607, India ', N'9820127610', N'', NULL, N'', N'The Holder', N'', N'', N'', N'', N'', N'3, Manorma Nagar Rd, Sambhaji Nagar, Manorama Nagar, Thane West, Mumbai, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (602675, N'1', N'15', N'', 82, N'MM1300150000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'The Holder', N'Mr', N'MR. BHAVESH PRAVIN DAGHA / MR. VIRAL LAKHAMSHI CHHEDA / MR. LEERA PARBAT BANGARI', N'', N'Eye Care Optics ,mix And Mach,career point Cota', N'HOUSE NO 51 NR DEV PUJA KOLSHET ROAD BALKUM DHOKALI', N'6XHJ+5FX, Kolshet Rd, Opposite Silverline, Shree Swamikrupa Phase 2, New Ganesh Nagar, Dhokali, Thane West, Thane, Maharashtra 400607, India ', N'9820165906', N'', NULL, N'', N'The Holder', N'', N'', N'', N'Eye Care Optics ,mix And Mach,career point Cota', N'', N'6XHJ+5FX, Kolshet Rd, Opposite Silverline, Shree Swamikrupa Phase 2, New Ganesh Nagar, Dhokali, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (602680, N'1', N'16', N'', 92, N'MM1300160000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'The Holder', N'Mr', N'M/S.  S. D. PAINTS', N'', N'ESDEE PAINTS LTD', N'HOUSE NO 52 NR SUBHASH SARAP KOLSHET ROAD BALKUM DHOKALI', N'Kavyaduara Residential Complex, Kolshet Rd, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', N'9372759045', N'', NULL, N'', N'The Holder', N'', N'', N'', N'ESDEE PAINTS LTD', N'', N'Kavyaduara Residential Complex, Kolshet Rd, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 57, CAST(N'2025-10-03T17:19:32.833' AS DateTime)),
 
 (604230, N'1', N'20', N'A', 12, N'MM130020000A', 0, N'', NULL, N'', 6, NULL, NULL, NULL, N'Riviera', NULL, NULL, NULL, NULL, N'Wing -RIVIERA A, Dhokali Manorama Nagar Kolshet Road Thane West', N'5, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Manpada, Thane, Maharashtra 400607, India ', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, N'Wing -RIVIERA A, Dhokali Manorama Nagar Kolshet Road Thane West', N'5, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Manpada, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (604231, N'1', N'20', N'B', 12, N'MM130020000B', 0, N'', NULL, N'', 6, NULL, NULL, NULL, N'Riviera', NULL, NULL, NULL, NULL, N'Wing -B, Dhokali Manorama Nagar Kolshet Road Thane West', N'5, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Manpada, Thane, Maharashtra 400607, India ', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, N'Wing -B, Dhokali Manorama Nagar Kolshet Road Thane West', N'5, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Manpada, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (604264, N'1', N'31', N'A1', 12, N'MM13003100A1', 0, NULL, NULL, NULL, 6, NULL, NULL, NULL, N'The Holder', NULL, N'', N'101', NULL, N'Wing-A, Flat No-101, Dhokali Manorama Nagar Kolshet Road Thane West', N'189, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', N'9869534650', NULL, NULL, NULL, N'The Holder', NULL, NULL, N'101', NULL, N'Wing-A, Flat No-101, Dhokali Manorama Nagar Kolshet Road Thane West', N'189, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (604265, N'1', N'31', N'A2', 12, N'MM13003100A2', 0, NULL, NULL, NULL, 6, NULL, NULL, NULL, N'The Holder', NULL, N'', N'201', NULL, N'Wing-A, Flat No-201, Dhokali Manorama Nagar Kolshet Road Thane West', N'189, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, N'', N'201', NULL, N'Wing-A, Flat No-201, Dhokali Manorama Nagar Kolshet Road Thane West', N'189, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (604266, N'1', N'31', N'A3', 12, N'MM13003100A3', 0, NULL, NULL, NULL, 6, NULL, NULL, NULL, N'The Holder', NULL, N'', N'301', NULL, N'Wing-A, Flat No-301, Dhokali Manorama Nagar Kolshet Road Thane West', N'189, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, N'', N'301', NULL, N'Wing-A, Flat No-301, Dhokali Manorama Nagar Kolshet Road Thane West', N'189, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (604267, N'1', N'31', N'A4', 12, N'MM13003100A4', 0, NULL, NULL, NULL, 6, NULL, NULL, NULL, N'The Holder', NULL, N'', N'401', NULL, N'Wing-A, Flat No-401, Dhokali Manorama Nagar Kolshet Road Thane West', N'189, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, N'', N'401', NULL, N'Wing-A, Flat No-401, Dhokali Manorama Nagar Kolshet Road Thane West', N'189, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (604268, N'1', N'31', N'A5', 12, N'MM13003100A5', 0, NULL, NULL, NULL, 6, NULL, NULL, NULL, N'The Holder', NULL, N'', N'501', NULL, N'Wing-A, Flat No-501, Dhokali Manorama Nagar Kolshet Road Thane West', N'189, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, N'', N'501', NULL, N'Wing-A, Flat No-501, Dhokali Manorama Nagar Kolshet Road Thane West', N'189, Shree Swamikrupa Phase 2, Dokali Pada, Dhokali, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (608764, N'1', N'1', N'', 51, N'MM1000010000', 0, N'45', N'98/440 ', N'', 6, NULL, NULL, N'Mr', N'SHRI. S. G.  KHALE HOLTIME DIRCTOR M/S. BOMBAY CHEMICALS PVT. LTD.,', N'Mr', N'THE LICENSEE: M/S. LANDMARK CAR LTD.,', N'', N'LANDMARK CARS', N'BOMBAY CHEMICALS PVT. LTD. THE LICENSEE : M/S LANDMARK CAR PVT. LTD. 275/A/2/2A, PATLIPADA, NEAR ST. XAVIER''S SCHOOL, G.B.ROAD, THANE (W.) 400607', N'5, S Vivekanand Marg, Brahmand, Manpada, Thane, Maharashtra 400607, India ', N'9869905413', N'', NULL, N'', N'à¤¶à¥à¤°à¥€. à¤à¤¸. à¤œà¥€. à¤—à¥‹à¤–à¤²à¥‡, à¤ªà¥‚à¤°à¥à¤£à¤µà¥‡à¤³ à¤¸à¤‚à¤šà¤¾à¤²à¤•, à¤®à¥‡à¤¸à¤°à¥à¤¸ à¤¬à¥‰à¤®à¥à¤¬à¥‡ à¤•à¥‡à¤®à¤¿à¤•à¤²à¥à¤¸ à¤ªà¥à¤°à¤¾à¤¯à¤µà¥à¤¹à¥‡à¤Ÿ à¤²à¤¿à¤®à¤¿à¤Ÿà¥‡à¤¡', N'', N'', N'', N'à¤²à¤à¤¡à¤®à¤¾à¤°à¥à¤• à¤•à¤¾à¤°', N'à¤¬à¥‰à¤®à¥à¤¬à¥‡ à¤•à¥‡à¤®à¤¿à¤•à¤²à¥à¤¸ à¤ªà¥à¤°à¤¾à¤¯à¤µà¥à¤¹à¥‡à¤Ÿ à¤²à¤¿à¤®à¤¿à¤Ÿà¥‡à¤¡. à¤ªà¤¾à¤Ÿà¤²à¥€à¤ªà¤¾à¤¡à¤¾, à¤¸à¥‡à¤‚à¤Ÿ à¤à¥‡à¤µà¤¿à¤¯à¤°à¥à¤¸ à¤¸à¥à¤•à¥‚à¤² à¤œà¤µà¤³, à¤œà¥€à¤¬à¥€à¤°à¥‹à¤¡, à¤ à¤¾à¤£à¥‡ (à¤µà¥‡à¤¸à¥à¤Ÿ ) à¥ªà¥¦à¥¦à¥¬à¥¦à¥­', N'5, S Vivekanand Marg, Brahmand, Manpada, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (608857, N'1', N'2', N'', 12, N'MM1000020000', 0, N'', NULL, N'', 6, NULL, NULL, N'Mr', N'CLOVERDALE CO-OP HOUSING SOCIETY LIMITED    ', N'', N'', N'', N'', N'BOMBAY CHEMICALS PVT. LTD. THE LICENSEE : M/S LANDMARK CAR PVT. LTD. 275/A/2/2A, PATLIPADA, NEAR ST. XAVIER''S SCHOOL, G.B.ROAD, THANE (W.) 400607', N'1303, Cloverdale, One Hiranandani Park, Brahmand, Thane West, Thane, Maharashtra 400607, India ', N'8169048567', N'', NULL, N'', N'.', N'', N'', N'', N'', N'', N'1303, Cloverdale, One Hiranandani Park, Brahmand, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 74, CAST(N'2025-09-16T12:49:15.893' AS DateTime)),
 
 (608928, N'1', N'5', N'', 12, N'MM1000050000', 0, N'', NULL, N'', 6, NULL, NULL, N'Mr', N'HAMPTON CO-OP HOUSING SOCIETY LIMITED', N'', N'THE HOLDER', N'', N'', N'HAMPTON,ONE HIRANANDANI PARK,PATLIPADA,GB ROAD,THANE WEST-400615', N'403, Willowcrest, One Hiranandani Park, Patlipada, Thane West, Brahmand, Thane, Maharashtra 400607, India ', N'9136821218', N'', NULL, N'', N'HAMPTON CO-OP HOUSING SOCIETY LIMITED', N'', N'', N'', N'', N'', N'403, Willowcrest, One Hiranandani Park, Patlipada, Thane West, Brahmand, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 60, CAST(N'2025-08-28T15:01:57.880' AS DateTime)),
 
 (608935, N'1', N'6', N'', 12, N'MM1000060000', 0, N'', NULL, N'', 6, NULL, NULL, N'Mr', N'EAGLETON CO-OP HOUSING SOCIETY LIMITED', N'', N'THE HOLDER', N'', N'', N'One Hiranandani Park Patlipada GB Road Thane West', N'2, S Vivekanand Marg, Brahmand, Manpada, Thane, Maharashtra 400607, India ', N'9619919019', N'', NULL, N'', N' EAGLETON CO-OP HOUSING SOCIETY .LTD   ', N'', N'', N'', N'', N'', N'2, S Vivekanand Marg, Brahmand, Manpada, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 60, CAST(N'2025-09-05T13:00:58.753' AS DateTime)),
 
 (608985, N'1', N'7', N'', 12, N'MM1000070000', 0, N'', NULL, N'', 6, NULL, NULL, N'Mr', N'CLIFTON  CO-OPERATIVE HOUSING SOCIETY LIMITED', N'', N'THE HOLDER', N'', N'', N'CLIFTON BLDG,NEAR GHODBANDAR ROAD THANE(W)', N'2, S Vivekanand Marg, Brahmand, Manpada, Thane, Maharashtra 400607, India ', N'9819502727', N'', NULL, N'', N'CLIFTON  CO-OPERATIVE HOUSING SOCIETY LIMITED ', N'', N'', N'', N'', N'', N'2, S Vivekanand Marg, Brahmand, Manpada, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 60, CAST(N'2025-08-26T14:05:10.887' AS DateTime)),
 
 (609019, N'1', N'8', N'', 12, N'MM1000080000', 0, N'', NULL, N'', 6, NULL, NULL, N'Mr', N'PRESTON CO-OP HOUSING SOCIETY LIMITED', N'', N'THE HOLDER', N'', N'', N'Survey No. 99/2 Preston Tower, One Hiranandani Park, Patlipada, Thane(W)', N'6XVG+MQX, Ghodbunder Service Rd, Brahmand, Thane West, Thane, Maharashtra 400607, India ', N'9821705686', N'', NULL, N'', N'.', N'', N'', N'', N'', N'', N'6XVG+MQX, Ghodbunder Service Rd, Brahmand, Thane West, Thane, Maharashtra 400607, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), 60, CAST(N'2025-08-28T18:27:09.703' AS DateTime)),
 
 (609287, N'1', N'4', N'A1', 12, N'MM10000400A1', 0, NULL, NULL, NULL, 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'101', NULL, N'Wing-A, Flat No-101, One Hiranandani Park Patlipada GB Road Thane West', N'Hiranandani Park Willowcrest, Brahmand, Thane West, Thane, Maharashtra, India ', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'101', NULL, N'Wing-A, Flat No-101, One Hiranandani Park Patlipada GB Road Thane West', N'Hiranandani Park Willowcrest, Brahmand, Thane West, Thane, Maharashtra, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (609288, N'1', N'4', N'A2', 12, N'MM10000400A2', 0, NULL, NULL, NULL, 6, NULL, NULL, NULL, N'FLAT HOLDER:', NULL, N'WILLOWCREST, M/S ROMA BUILDERS PVT. LTD.', N'201', NULL, N'Wing-A, Flat No-201, One Hiranandani Park Patlipada GB Road Thane West', N'Hiranandani Park Willowcrest, Brahmand, Thane West, Thane, Maharashtra, India ', N'9322952476', NULL, NULL, NULL, NULL, NULL, NULL, N'201', NULL, N'Wing-A, Flat No-201, One Hiranandani Park Patlipada GB Road Thane West', N'Hiranandani Park Willowcrest, Brahmand, Thane West, Thane, Maharashtra, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (609289, N'1', N'4', N'A3', 12, N'MM10000400A3', 0, NULL, NULL, NULL, 6, NULL, NULL, NULL, N'FLAT HOLDER: ARCHANA MANGALAGIRI / RANJANA MANGALAGIRI   WILLOWCREST, M/S ROMA BUILDERS PVT. LTD.', NULL, N'', N'301', NULL, N'Wing-A, Flat No-301, One Hiranandani Park Patlipada GB Road Thane West', N'Hiranandani Park Willowcrest, Brahmand, Thane West, Thane, Maharashtra, India ', N'9920695522', NULL, NULL, NULL, NULL, NULL, NULL, N'301', NULL, N'Wing-A, Flat No-301, One Hiranandani Park Patlipada GB Road Thane West', N'Hiranandani Park Willowcrest, Brahmand, Thane West, Thane, Maharashtra, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (609290, N'1', N'4', N'A4', 12, N'MM10000400A4', 0, NULL, NULL, NULL, 6, NULL, NULL, NULL, N'FLAT HOLDER:', NULL, N'WILLOWCREST, M/S ROMA BUILDERS PVT. LTD.', N'401', NULL, N'Wing-A, Flat No-401, One Hiranandani Park Patlipada GB Road Thane West', N'Hiranandani Park Willowcrest, Brahmand, Thane West, Thane, Maharashtra, India ', N'7208489397', NULL, NULL, NULL, NULL, NULL, NULL, N'401', NULL, N'Wing-A, Flat No-401, One Hiranandani Park Patlipada GB Road Thane West', N'Hiranandani Park Willowcrest, Brahmand, Thane West, Thane, Maharashtra, India ', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (750338, N'1',N'1', N'D1', 12, NULL, 0, N'', NULL, N'', 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'101', NULL, N'Wing-D, Flat No-101, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'101', NULL, N'Wing-D, Flat No-101, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (750339, N'1',N'1', N'D2', 12, NULL, 0, N'', NULL, N'', 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'201', NULL, N'Wing-D, Flat No-201, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'201', NULL, N'Wing-D, Flat No-201, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (750340, N'1',N'1', N'D3', 12, NULL, 0, N'', NULL, N'', 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'301', NULL, N'Wing-D, Flat No-301, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'301', NULL, N'Wing-D, Flat No-301, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (750341, N'1',N'1', N'D4', 12, NULL, 0, N'', NULL, N'', 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'401', NULL, N'Wing-D, Flat No-401, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'401', NULL, N'Wing-D, Flat No-401, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (750342, N'1',N'1', N'D5', 12, NULL, 0, N'', NULL, N'', 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'501', NULL, N'Wing-D, Flat No-501, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'501', NULL, N'Wing-D, Flat No-501, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (750343, N'1',N'1', N'D6', 12, NULL, 0, N'', NULL, N'', 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'601', NULL, N'Wing-D, Flat No-601, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'601', NULL, N'Wing-D, Flat No-601, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (750344, N'1',N'1', N'D7', 12, NULL, 0, N'', NULL, N'', 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'701', NULL, N'Wing-D, Flat No-701, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'701', NULL, N'Wing-D, Flat No-701, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (750345, N'1',N'1', N'D8', 12, NULL, 0, N'', NULL, N'', 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'801', NULL, N'Wing-D, Flat No-801, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'801', NULL, N'Wing-D, Flat No-801, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
 (750346, N'1',N'1', N'D9', 12, NULL, 0, N'', NULL, N'', 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'901', NULL, N'Wing-D, Flat No-901, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'901', NULL, N'Wing-D, Flat No-901, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL),
 
    (750347, N'1', N'1', N'D10', 12, NULL, 0, N'', NULL, N'', 6, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'1001', NULL, N'Wing-D, Flat No-1001, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', NULL, NULL, NULL, NULL, N'The Holder', NULL, NULL, N'1001', NULL, N'Wing-D, Flat No-1001, Hubtown Greenwoods, Opposite Thirani High School Pokharan road number 1 ,Vartak Nagar', N'', 0, 1, NULL, CAST(N'2026-01-21T18:12:16.440' AS DateTime), NULL, NULL)
) AS pd(PropertyId, TaxZoneId, PropertyNo, PartitionNo, PropertyTypeId, UPICId, OpenPlot, CSN, SubZoneNo, PlotNo, CategoryId, Type, PartType, OwnerTitle, OwnerName, OccupierTitle, OccupierName, FlatOrShopNo, FlatOrShopName, Address, Location, MobileNo, EmailId, WingDetailId, OwnerTitleEnglish, OwnerNameEnglish, OccupierTitleEnglish, OccupierNameEnglish, FlatOrShopNoEnglish, FlatOrShopNameEnglish, AddressEnglish, LocationEnglish, MarkedForDeletion, IsActive, CreatedBy, CreatedDate, UpdatedBy, UpdatedDate);
GO

SET IDENTITY_INSERT [PTIS].[PropertyMastOld] OFF;
GO


 

           
 SET IDENTITY_INSERT [PTIS].[SocietyDetailsMast] ON 
GO
INSERT [PTIS].[SocietyDetailsMast] ([Id], [PropertyId], [SocietyName], [SocietyAddress], [SecretaryName], [ManagerName], [LandOwnerName], [BuilderName], [SocietyNameEnglish], [SocietyAddressEnglish], [SecretaryNameEnglish], [ManagerNameEnglish], [LandOwnerNameEnglish], [BuilderNameEnglish], [ManagerMobileNo], [SecretaryMobileNo], [SocietyEmailId], [SecretaryEmailId], [ManagerEmailId], [MarkedForDeletion], [MarkedForDeletionDate], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES 
(4, 549357, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (5, 549439, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (6, 549441, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (7, 549442, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (8, 549445, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (9, 549446, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (10, 549448, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (11, 549451, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (12, 549452, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (13, 549453, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (14, 550296, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (15, 550299, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (16, 550300, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (17, 550304, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (18, 550514, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (19, 550516, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (20, 550722, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (21, 550726, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (22, 550727, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (23, 550728, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (24, 552371, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (25, 552372, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (26, 552373, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (27, 552374, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (28, 552375, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (29, 552376, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (30, 552377, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (31, 552378, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (32, 552379, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (33, 552380, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (34, 552994, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (35, 553033, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (36, 553034, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (37, 553035, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (38, 553036, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (39, 553037, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (40, 553038, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (41, 553039, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (42, 553040, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (43, 553041, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (44, 556004, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (45, 556008, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (46, 556010, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (47, 556011, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (48, 556012, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (49, 556013, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (50, 556014, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (51, 556015, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (52, 556016, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (53, 556017, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (54, 560660, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (55, 560661, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (56, 560662, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (57, 560663, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (58, 560664, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (59, 560665, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (60, 560666, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (61, 560667, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (62, 560668, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (63, 560669, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (64, 576936, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (65, 576939, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (66, 577185, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (67, 577437, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (68, 577538, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (69, 577957, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (70, 579097, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (71, 579098, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (72, 579099, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (73, 579100, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (74, 599038, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (75, 602675, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (76, 602680, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (77, 604230, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (78, 604231, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (79, 604264, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (80, 604265, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (81, 604266, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (82, 604267, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (83, 604268, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (84, 608764, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (85, 608857, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (86, 608928, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (87, 608935, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (88, 608985, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (89, 609019, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (90, 609287, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (91, 609288, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (92, 609289, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (93, 609290, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (94, 750338, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (95, 750339, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (96, 750340, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (97, 750341, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (98, 750342, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (99, 750343, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (100, 750344, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (101, 750345, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (102, 750346, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL),
 
  (103, 750347, N'Shiv Residency', N'Main Road, City Area', N'रमेश पटेल', N'अमित शाह', N'धीरुभाई पटेल', N'सूरज बिल्डर', N'Shiv Residency', N'Main Road, City Area', N'Ramesh Patel', N'Amit Shah', N'Dhirubhai Patel', N'Suraj Builder', N'9876543210', N'9123456780', N'society@gmail.com', N'secretary@gmail.com', N'manager@gmail.com', 0, CAST(N'1900-01-01T00:00:00.000' AS DateTime), 1, 1, CAST(N'2026-03-25T12:44:13.140' AS DateTime), NULL, NULL)
GO
SET IDENTITY_INSERT [PTIS].[SocietyDetailsMast] OFF

GO
SET IDENTITY_INSERT [PTIS].[PropertyMapMaster] ON 
GO
INSERT [PTIS].[PropertyMapMaster] ([Id], [ModuleId], [ParentPropertyMapId], [VersionNo], [MappingCategory], [ChangeReason], [Remark], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (1, NULL, NULL, 1, N'ONE_TO_ONE', NULL, N'One old property mapped to one new property', 1, 1, CAST(N'2026-05-07T18:58:37.810' AS DateTime), NULL, NULL)
GO
INSERT [PTIS].[PropertyMapMaster] ([Id], [ModuleId], [ParentPropertyMapId], [VersionNo], [MappingCategory], [ChangeReason], [Remark], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2, NULL, NULL, 1, N'SPLIT', NULL, N'One old property split into two new properties', 1, 1, CAST(N'2026-05-07T18:58:37.823' AS DateTime), NULL, NULL)
GO
INSERT [PTIS].[PropertyMapMaster] ([Id], [ModuleId], [ParentPropertyMapId], [VersionNo], [MappingCategory], [ChangeReason], [Remark], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (3, NULL, NULL, 1, N'MERGE', NULL, N'Two old properties merged into one new property', 1, 1, CAST(N'2026-05-07T18:58:37.823' AS DateTime), NULL, NULL)
GO
INSERT [PTIS].[PropertyMapMaster] ([Id], [ModuleId], [ParentPropertyMapId], [VersionNo], [MappingCategory], [ChangeReason], [Remark], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (4, NULL, NULL, 1, N'MAP', NULL, N'Identity old property to map old society', 1, 1, CAST(N'2026-05-07T18:58:37.823' AS DateTime), NULL, NULL)
GO
SET IDENTITY_INSERT [PTIS].[PropertyMapMaster] OFF


-- SET IDENTITY_INSERT [PTIS].[PropertyMapDetail] ON;

-- INSERT INTO [PTIS].[PropertyMapDetail]
-- (
--     [Id],[PropertyMapId],[PropertySide],[PropertyIdNew],[PropertyIdOld],
--     [PropertyNo],[TaxSharePercent],[AreaSharePercent],[Status],[IsCurrent],
--     [ChangeReason],[Remark],[Latitude],[Longitude],[Location],
--     [IsActive],[CreatedBy],[CreatedDate],[UpdatedBy],[UpdatedDate]
-- )
-- VALUES
-- (1,1,'OLD',NULL,7,N'OLD-101',100.0000,100.0000,'MODIFIED',1,NULL,NULL,19.12345678,72.88991111,N'Old Property Location',1,1,'2026-05-07T18:58:37.820',NULL,NULL),
-- (2,1,'NEW',549439,NULL,N'NEW-501',100.0000,100.0000,'MODIFIED',1,NULL,NULL,19.12355678,72.88992222,N'New Property Location',1,1,'2026-05-07T18:58:37.820',NULL,NULL),

-- (3,2,'OLD',NULL,6,N'OLD-102',100.0000,100.0000,'MODIFIED',1,NULL,NULL,19.22345678,72.98991111,N'Original Split Property',1,1,'2026-05-07T18:58:37.823',NULL,NULL),
-- (4,2,'NEW',549442,NULL,N'NEW-502',60.0000,60.0000,'MODIFIED',1,NULL,NULL,19.22355678,72.98992222,N'Split Property A',1,1,'2026-05-07T18:58:37.823',NULL,NULL),
-- (5,2,'NEW',599038,NULL,N'NEW-503',40.0000,40.0000,'MODIFIED',1,NULL,NULL,19.22365678,72.98993333,N'Split Property B',1,1,'2026-05-07T18:58:37.823',NULL,NULL),

-- (6,3,'OLD',NULL,3,N'OLD-103',100.0000,50.0000,'MODIFIED',0,N'Mapping corrected after survey review',NULL,19.32345678,73.08991111,N'Merged Old Property 1',1,1,'2026-05-07T18:58:37.823',1,'2026-05-07T18:58:37.823'),
-- (7,3,'OLD',NULL,4,N'OLD-104',100.0000,50.0000,'MODIFIED',0,N'Mapping corrected after survey review',NULL,19.32355678,73.08992222,N'Merged Old Property 2',1,1,'2026-05-07T18:58:37.823',1,'2026-05-07T18:58:37.823'),
-- (8,3,'NEW',579098,NULL,N'NEW-504',100.0000,100.0000,'MODIFIED',0,N'Mapping corrected after survey review',NULL,19.32365678,73.08993333,N'Merged New Property',1,1,'2026-05-07T18:58:37.823',1,'2026-05-07T18:58:37.823'),

-- (9,4,'OLD',NULL,5,N'OLD-105',100.0000,100.0000,'MODIFIED',1,NULL,NULL,19.32345678,73.08991111,N'Corrected Old Property',1,1,'2026-05-07T18:58:37.823',NULL,NULL),
-- (10,4,'NEW',577538,NULL,N'NEW-505',100.0000,100.0000,'MODIFIED',1,NULL,NULL,19.32375678,73.08994444,N'Corrected New Property',1,1,'2026-05-07T18:58:37.823',NULL,NULL);

-- SET IDENTITY_INSERT [PTIS].[PropertyMapDetail] OFF;

    
-- ===============================
-- Socail Details Mast
-- ===============================
INSERT INTO PTIS.SocialAttributeMaster (SocialAttributeCode, SocialAttributeName, DataType)
VALUES
('ROAD_WIDTH', 'Road Width', 'DECIMAL'),
('WATER_CONN_STATUS', 'Water Connection Status', 'INT'),
('WATER_CONN_YEAR', 'Water Connection Year', 'INT'),
('HAS_WATER_METER', 'Water Meter Available', 'BIT');
INSERT INTO PTIS.SocialAttributeMaster (SocialAttributeCode, SocialAttributeName, DataType)
VALUES
('HAS_WELL', 'Well Available', 'BIT'),
('HAS_BOREWELL', 'Borewell Available', 'BIT'),
('HAS_HAND_PUMP', 'Hand Pump', 'BIT');

INSERT INTO PTIS.SocialAttributeMaster
(SocialAttributeCode, SocialAttributeName, DataType, ParentAttributeId, IsRequiredWhenParentTrue)
SELECT 'NO_OF_WELL', 'Number Of Wells', 'INT', Id, 1
FROM PTIS.SocialAttributeMaster WHERE SocialAttributeCode = 'HAS_WELL';

INSERT INTO PTIS.SocialAttributeMaster
(SocialAttributeCode, SocialAttributeName, DataType, ParentAttributeId, IsRequiredWhenParentTrue)
SELECT 'NO_OF_BOREWELL', 'Number Of Borewells', 'INT', Id, 1
FROM PTIS.SocialAttributeMaster WHERE SocialAttributeCode = 'HAS_BOREWELL';
INSERT INTO PTIS.SocialAttributeMaster (SocialAttributeCode, SocialAttributeName, DataType)
VALUES
('HAS_DRAIN', 'Drain Available', 'BIT'),
('HAS_SEPTIC_TANK', 'Septic Tank', 'BIT'),
('HAS_STP', 'Sewage Treatment Plant', 'BIT');


INSERT INTO PTIS.SocialAttributeMaster (SocialAttributeCode, SocialAttributeName, DataType)
VALUES
('HAS_GARBAGE_SEGREGATION', 'Garbage Segregation', 'BIT'),
('HAS_GARBAGE_DISPOSAL', 'Garbage Disposal', 'BIT');

INSERT INTO PTIS.SocialAttributeMaster (SocialAttributeCode, SocialAttributeName, DataType)
VALUES
('HAS_ELECTRIC_CONNECTION', 'Electric Connection', 'BIT'),
('HAS_ELECTRIC_BILL', 'Electric Bill Available', 'BIT'),
('HAS_EV_CHARGING', 'EV Charging Station', 'BIT');

INSERT INTO PTIS.SocialAttributeMaster
(SocialAttributeCode, SocialAttributeName, DataType, IsDiscountApplicable)
VALUES
('HAS_SOLAR', 'Solar Installed', 'BIT', 1),
('HAS_SOLAR_ELECTRIC', 'Solar Electric System', 'BIT', 1),
('HAS_SOLAR_WATER_HEATER', 'Solar Water Heater', 'BIT', 1);

INSERT INTO PTIS.SocialAttributeMaster
(SocialAttributeCode, SocialAttributeName, DataType, ParentAttributeId, IsRequiredWhenParentTrue, IsDiscountApplicable)
SELECT 'NO_OF_SOLAR', 'Number Of Solar Units', 'INT', Id, 1, 1
FROM PTIS.SocialAttributeMaster WHERE SocialAttributeCode = 'HAS_SOLAR';

INSERT INTO PTIS.SocialAttributeMaster
(SocialAttributeCode, SocialAttributeName, DataType, Unit, ParentAttributeId, IsRequiredWhenParentTrue, IsDiscountApplicable)
SELECT 'SOLAR_ELECTRIC_KW', 'Solar Electric Capacity (KW)', 'DECIMAL', 'KW', Id, 1, 1
FROM PTIS.SocialAttributeMaster WHERE SocialAttributeCode = 'HAS_SOLAR_ELECTRIC';

INSERT INTO PTIS.SocialAttributeMaster
(SocialAttributeCode, SocialAttributeName, DataType, Unit, ParentAttributeId, IsRequiredWhenParentTrue, IsDiscountApplicable)
SELECT 'SOLAR_WATER_CAPACITY_LTR', 'Solar Water Capacity (Liter)', 'INT', 'LITER', Id, 1, 1
FROM PTIS.SocialAttributeMaster WHERE SocialAttributeCode = 'HAS_SOLAR_WATER_HEATER';

INSERT INTO PTIS.SocialAttributeMaster (SocialAttributeCode, SocialAttributeName, DataType)
VALUES ('HAS_DIESEL_GENERATOR', 'Diesel Generator', 'BIT');

INSERT INTO PTIS.SocialAttributeMaster
(SocialAttributeCode, SocialAttributeName, DataType, Unit, ParentAttributeId, IsRequiredWhenParentTrue)
SELECT 'GENERATOR_CAPACITY_KW', 'Generator Capacity (KW)', 'DECIMAL', 'KW', Id, 1
FROM PTIS.SocialAttributeMaster WHERE SocialAttributeCode = 'HAS_DIESEL_GENERATOR';

INSERT INTO PTIS.SocialAttributeMaster (SocialAttributeCode, SocialAttributeName, DataType)
VALUES
('HAS_FIRE_FIGHTING_SYSTEM', 'Fire Fighting System', 'BIT'),
('HAS_FIRE_MACHINE', 'Fire Machine', 'BIT'),
('HAS_LIFT', 'Lift Available', 'BIT'),
('HAS_STAIRS', 'Stairs Available', 'BIT');

INSERT INTO PTIS.SocialAttributeMaster
(SocialAttributeCode, SocialAttributeName, DataType, ParentAttributeId, IsRequiredWhenParentTrue)
SELECT 'NO_OF_LIFT', 'Number Of Lifts', 'INT', Id, 1
FROM PTIS.SocialAttributeMaster WHERE SocialAttributeCode = 'HAS_LIFT';

INSERT INTO PTIS.SocialAttributeMaster (SocialAttributeCode, SocialAttributeName, DataType)
VALUES ('NO_OF_TREES', 'Number Of Trees', 'INT');

INSERT INTO PTIS.SocialAttributeMaster
(SocialAttributeCode, SocialAttributeName, DataType, IsDiscountApplicable)
VALUES
('HAS_RAINWATER_HARVESTING', 'Rainwater Harvesting', 'BIT', 1),
('IS_GREEN_PROPERTY', 'Green Property', 'BIT', 1);

INSERT INTO PTIS.SocialAttributeMaster
(SocialAttributeCode, SocialAttributeName, DataType, ParentAttributeId, IsRequiredWhenParentTrue, IsDiscountApplicable)
SELECT 'GREEN_PROPERTY_STAR', 'Green Property Star Rating', 'INT', Id, 1, 1
FROM PTIS.SocialAttributeMaster WHERE SocialAttributeCode = 'IS_GREEN_PROPERTY';

INSERT INTO PTIS.SocialAttributeMaster (SocialAttributeCode, SocialAttributeName, DataType)
VALUES ('HAS_MTDC_REG', 'MTDC Registration', 'BIT');

INSERT INTO PTIS.SocialAttributeMaster
(SocialAttributeCode, SocialAttributeName, DataType, IsDiscountApplicable)
VALUES
('HAS_FAMILY_PLANNING', 'Family Planning Benefit', 'BIT', 1),
('HAS_WOMEN_OWNER', 'Women Owner Benefit', 'BIT', 1);

INSERT INTO PTIS.SocialAttributeMaster (SocialAttributeCode, SocialAttributeName, DataType)
VALUES
('HAS_CLUB_HOUSE', 'Club House Available', 'BIT'),
('HAS_SWIMMING_POOL', 'Swimming Pool Available', 'BIT');

INSERT INTO PTIS.SocialAttributeMaster
(SocialAttributeCode, SocialAttributeName, DataType, ParentAttributeId, IsRequiredWhenParentTrue)
SELECT 'NO_OF_SWIMMING_POOL', 'Number Of Swimming Pools', 'INT', Id, 1
FROM PTIS.SocialAttributeMaster WHERE SocialAttributeCode = 'HAS_SWIMMING_POOL';

-- Common-area attributes: captured on the main building/wing, hidden on apartment unit
UPDATE PTIS.SocialAttributeMaster
SET IsCommonAreaAttribute = 1
WHERE SocialAttributeCode IN (
    'HAS_LIFT', 'NO_OF_LIFT', 'HAS_STAIRS',
    'HAS_CLUB_HOUSE', 'HAS_SWIMMING_POOL', 'NO_OF_SWIMMING_POOL',
    'HAS_DIESEL_GENERATOR', 'GENERATOR_CAPACITY_KW',
    'HAS_FIRE_FIGHTING_SYSTEM', 'HAS_FIRE_MACHINE',
    'HAS_STP', 'HAS_EV_CHARGING'
);




-- ============================================================================
-- CORE Module - CDC Table Registration (PTIS)
-- ============================================================================

SET IDENTITY_INSERT [CORE].[CdcTableConfig] ON;

INSERT INTO [CORE].[CdcTableConfig]
(
    [Id],[DepartmentCode],[CaptureInstance],[SourceSchema],[SourceTable],
    [ProcessingType],[CalculationType],[EntityType],[TriggersRecalculation],[IsActive],
    [CreatedDate],[UpdatedDate]
)
SELECT *
FROM
(
    VALUES
    (1,'PTIS','PTIS_PropertyMast','PTIS','PropertyMast','ENTITY','BOTH','PROPERTY',1,1,'2026-09-03 17:55:53.893','2026-09-08 14:30:52.850'),
    (2,'PTIS','PTIS_PropertyDetails','PTIS','PropertyDetails','ENTITY','BOTH','PROPERTY',1,1,'2026-09-03 17:55:53.893','2026-09-08 14:30:52.850'),
    (3,'PTIS','PTIS_RenterMast','PTIS','RenterMast','ENTITY','RV','PROPERTY',1,1,'2026-09-03 17:55:53.893','2026-09-08 14:30:52.850'),
    (4,'PTIS','PTIS_RenterDetails','PTIS','RenterDetails','ENTITY','RV','PROPERTY',1,1,'2026-09-03 17:55:53.893','2026-09-08 14:30:52.850'),
    (5,'PTIS','PTIS_PropertyCertificates','PTIS','PropertyCertificates','ENTITY','BOTH','PROPERTY',1,1,'2026-09-03 17:55:53.893','2026-09-08 14:30:52.850'),
    (6,'PTIS','PTIS_PropertySocialDetails','PTIS','PropertySocialDetails','ENTITY','BOTH','PROPERTY',1,1,'2026-09-03 17:55:53.893','2026-09-08 14:30:52.850'),
    (7,'PTIS','PTIS_PropertyOccupancyDetails','PTIS','PropertyOccupancyDetails','ENTITY','BOTH','PROPERTY',1,1,'2026-09-03 17:55:53.893','2026-09-08 14:30:52.850'),
    (8,'PTIS','PTIS_SocietyDetailsMast','PTIS','SocietyDetailsMast','ENTITY','BOTH','PROPERTY',1,1,'2026-09-03 17:55:53.893','2026-09-08 14:30:52.850'),
    (9,'PTIS','PTIS_WingDetailsMast','PTIS','WingDetailsMast','ENTITY','BOTH','PROPERTY',1,1,'2026-09-03 17:55:53.893','2026-09-08 14:30:52.850'),
    (10,'PTIS','PTIS_RateMaster','PTIS','RateMaster','MASTER','RV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (11,'PTIS','PTIS_RateSectionMaster','PTIS','RateSectionMaster','MASTER','RV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (12,'PTIS','PTIS_RateSectionDetails','PTIS','RateSectionDetails','MASTER','RV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (13,'PTIS','PTIS_TypeOfUseMaster','PTIS','TypeOfUseMaster','MASTER','BOTH',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-07 12:08:01.497'),
    (14,'PTIS','PTIS_TypeOfUseCategoryMaster','PTIS','TypeOfUseCategoryMaster','MASTER','BOTH',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-07 12:10:56.950'),
    (15,'PTIS','PTIS_ConstructionTypeMaster','PTIS','ConstructionTypeMaster','MASTER','RV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (16,'PTIS','PTIS_FloorMaster','PTIS','FloorMaster','MASTER','RV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (17,'PTIS','PTIS_DepreciationMaster','PTIS','DepreciationMaster','MASTER','RV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (18,'PTIS','PTIS_TaxPercentageMasterRV','PTIS','TaxPercentageMasterRV','MASTER','RV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-07 12:11:16.680'),
    (19,'PTIS','PTIS_AssessmentYearRangeMasterRV','PTIS','AssessmentYearRangeMasterRV','MASTER','RV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (20,'PTIS','PTIS_EmploymentTaxMaster','PTIS','EmploymentTaxMaster','MASTER','RV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (21,'PTIS','PTIS_EducationTaxMaster','PTIS','EducationTaxMaster','MASTER','RV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (22,'PTIS','PTIS_RateCVMaster','PTIS','RateCVMaster','MASTER','CV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.293'),
    -- Row 23 (PTIS_RateMasterCV / PTIS.RateMasterCV) skipped: no such table in PTIS schema
    -- (only PTIS.RateCVMaster, above, exists).
    (24,'PTIS','PTIS_CSNDetails','PTIS','CSNDetails','MASTER','CV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.293'),
    (25,'PTIS','PTIS_AssessmentYearRangeMasterCV','PTIS','AssessmentYearRangeMasterCV','MASTER','CV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.293'),
    (26,'PTIS','PTIS_TaxPercentageMasterCV','PTIS','TaxPercentageMasterCV','MASTER','CV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.293'),
    (27,'PTIS','PTIS_MoujaMaster','PTIS','MoujaMaster','MASTER','CV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.293'),
    (28,'PTIS','PTIS_TaxMaster','PTIS','TaxMaster','MASTER','BOTH',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (29,'PTIS','PTIS_TaxCategoryMaster','PTIS','TaxCategoryMaster','MASTER','BOTH',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (30,'PTIS','PTIS_PolicyConfiguration','PTIS','PolicyConfiguration','MASTER','BOTH',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (31,'PTIS','PTIS_PropertyMastOld','PTIS','PropertyMastOld','ENTITY','BOTH','PROPERTY',1,1,'2026-09-07 11:44:58.460','2026-09-08 14:30:52.850'),
    (32,'PTIS','PTIS_PropertyDetailsOld','PTIS','PropertyDetailsOld','ENTITY','BOTH','PROPERTY',1,1,'2026-09-07 12:00:37.460','2026-09-08 14:30:52.850')
) S
(
    Id,DepartmentCode,CaptureInstance,SourceSchema,SourceTable,
    ProcessingType,CalculationType,EntityType,TriggersRecalculation,IsActive,
    CreatedDate,UpdatedDate
)
WHERE NOT EXISTS
(
    SELECT 1
    FROM [CORE].[CdcTableConfig] C
    WHERE C.Id = S.Id
       OR C.CaptureInstance = S.CaptureInstance
);

SET IDENTITY_INSERT [CORE].[CdcTableConfig] OFF;

------------------------------------------------------------

