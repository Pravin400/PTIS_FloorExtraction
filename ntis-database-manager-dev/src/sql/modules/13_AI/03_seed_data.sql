-- AI Chatbot - Seed Data
-- Fresh database seeds: explicit identity IDs; run once after schema creation.
-- CORE configuration defaults are seeded by 01_CORE/03_seed_data.sql.

-- ----------------------------------------------------------------------------
-- AI.QuestionCategory — top-level categories, with Civil Registration parent
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT [AI].[QuestionCategory] ON;
INSERT INTO [AI].[QuestionCategory] ([Id], [CategoryCode], [CategoryName], [ParentCategoryId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [MarkedForDeletion], [MarkedForDeletionDate])
SELECT S.[Id], S.[CategoryCode], S.[CategoryName], NULL, 0, 1, 1, GETDATE(), 0, NULL
FROM (VALUES
    (1, N'PROPERTY_TAX',        N'Property Tax'),
    (2, N'WATER_SUPPLY',        N'Water Supply'),
    (3, N'COMPLAINT',           N'Complaints & Grievances'),
    (4, N'BUILDING_PERMISSION', N'Building Permission'),
    (5, N'CIVIL_REGISTRATION',  N'Civil Registration')
) AS S ([Id], [CategoryCode], [CategoryName]);
SET IDENTITY_INSERT [AI].[QuestionCategory] OFF;
GO

SET IDENTITY_INSERT [AI].[QuestionCategory] ON;
INSERT INTO [AI].[QuestionCategory] ([Id], [CategoryCode], [CategoryName], [ParentCategoryId], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [MarkedForDeletion], [MarkedForDeletionDate])
SELECT S.[Id], S.[CategoryCode], S.[CategoryName],
        (SELECT [Id] FROM [AI].[QuestionCategory] WHERE [CategoryCode] = S.[ParentCategoryCode]),
        0, 1, 1, GETDATE(), 0, NULL
FROM (VALUES
    (6, N'BIRTH_CERTIFICATE', N'Birth Certificate', N'CIVIL_REGISTRATION'),
    (7, N'DEATH_CERTIFICATE', N'Death Certificate', N'CIVIL_REGISTRATION')
) AS S ([Id], [CategoryCode], [CategoryName], [ParentCategoryCode]);
SET IDENTITY_INSERT [AI].[QuestionCategory] OFF;
GO

-- ----------------------------------------------------------------------------
-- AI.ModelConfiguration — default chat + embedding models (Ollama)
-- ----------------------------------------------------------------------------
-- ROUTER is a distinct, deliberately cheap/fast model (low temperature - a classifier, not a
-- conversationalist) used only by the AI Orchestrator's Semantic Router (Phase 2) to produce a
-- structured IntentPlan; never used to compose citizen-facing text.
SET IDENTITY_INSERT [AI].[ModelConfiguration] ON;
INSERT INTO [AI].[ModelConfiguration] ([Id], [ModelType], [ModelName], [Provider], [EndpointUrl], [ContextWindowTokens], [MaxOutputTokens], [EmbeddingDimension], [Temperature], [TopP], [IsDefault], [IsActive], [CreatedBy], [CreatedDate], [MarkedForDeletion], [MarkedForDeletionDate])
SELECT S.[Id], S.[ModelType], S.[ModelName], S.[Provider], S.[EndpointUrl], S.[ContextWindowTokens], S.[MaxOutputTokens], S.[EmbeddingDimension], S.[Temperature], S.[TopP], S.[IsDefault], 1, 1, GETDATE(), 0, NULL
FROM (VALUES
    (1, N'CHAT',      N'minimax-m3:cloud',  N'OLLAMA', N'http://localhost:11434', 32768, 4096, NULL, CAST(0.70 AS DECIMAL(3,2)), CAST(0.90 AS DECIMAL(3,2)), 1),
    (2, N'EMBEDDING', N'nomic-embed-text',  N'OLLAMA', N'http://localhost:11434', NULL,  NULL, 768,  NULL,                      NULL,                      1),
    (3, N'ROUTER',    N'minimax-m3:cloud',  N'OLLAMA', N'http://localhost:11434', 32768, 512,  NULL, CAST(0.10 AS DECIMAL(3,2)), CAST(0.90 AS DECIMAL(3,2)), 1)
) AS S ([Id], [ModelType], [ModelName], [Provider], [EndpointUrl], [ContextWindowTokens], [MaxOutputTokens], [EmbeddingDimension], [Temperature], [TopP], [IsDefault]);
SET IDENTITY_INSERT [AI].[ModelConfiguration] OFF;
GO

-- ----------------------------------------------------------------------------
-- AI.VectorCollection — one Qdrant collection per knowledge-base area
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT [AI].[VectorCollection] ON;
INSERT INTO [AI].[VectorCollection] ([Id], [CollectionName], [DisplayName], [ModelConfigurationId], [VectorDimension], [DistanceMetric], [IsActive], [CreatedBy], [CreatedDate], [MarkedForDeletion], [MarkedForDeletionDate])
SELECT S.[Id], S.[CollectionName], S.[DisplayName],
        (SELECT [Id] FROM [AI].[ModelConfiguration] WHERE [ModelType] = 'EMBEDDING' AND [ModelName] = 'nomic-embed-text' AND [Provider] = 'OLLAMA'),
        768, 'COSINE', 1, 1, GETDATE(), 0, NULL
FROM (VALUES
    (1, N'karmitra_faq', N'FAQ'),
    (2, N'karmitra_property_tax', N'Property Tax'),
    (3, N'karmitra_water_supply', N'Water Supply'),
    (4, N'karmitra_building_permission', N'Building Permission')
) AS S ([Id], [CollectionName], [DisplayName]);
SET IDENTITY_INSERT [AI].[VectorCollection] OFF;
GO

-- ----------------------------------------------------------------------------
-- AI.PromptTemplate — minimal placeholder templates, refine later
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT [AI].[PromptTemplate] ON;
INSERT INTO [AI].[PromptTemplate] ([Id], [TemplateCode], [TemplateName], [Category], [TemplateContent], [Version], [IsDefault], [IsActive], [CreatedBy], [CreatedDate], [MarkedForDeletion], [MarkedForDeletionDate])
SELECT S.[Id], S.[TemplateCode], S.[TemplateName], S.[Category],
        N'You are Karmitra, an AI assistant for the ULB. Do not introduce yourself or restate who you are unless the citizen greets you (e.g. "hi"/"hello") or explicitly asks who or what you are - in that case, briefly say you are Karmitra, an AI assistant for the ULB. For every other question, answer directly and concisely using only the provided context, with no self-introduction. Context: {context} Question: {question}',
        1, S.[IsDefault], 1, 1, GETDATE(), 0, NULL
FROM (VALUES
    (1, N'GENERAL_CHAT', N'General Chat',        CAST(NULL AS VARCHAR(50)), 1),
    (2, N'CITIZEN_INFO', N'Citizen Information', N'CITIZEN_INFO',           0),
    (3, N'PROPERTY_TAX', N'Property Tax',        N'PROPERTY_TAX',           0),
    (4, N'COMPLAINT',    N'Complaint',           N'COMPLAINT',              0),
    (5, N'FAQ',          N'FAQ',                 N'FAQ',                    0)
) AS S ([Id], [TemplateCode], [TemplateName], [Category], [IsDefault]);
SET IDENTITY_INSERT [AI].[PromptTemplate] OFF;
GO

-- ----------------------------------------------------------------------------
-- AI.PromptTemplate - personalize the CITIZEN_INFO seed for authenticated citizens.
-- ----------------------------------------------------------------------------
UPDATE [AI].[PromptTemplate]
SET [TemplateContent] = N'You are Karmitra, an AI assistant for the ULB, currently helping a signed-in citizen. Use the citizen''s own account information below to answer questions about their own requests, complaints, or profile - never invent status information not present below. If the citizen''s question is instead about general ULB information, use the knowledge-base context. Do not introduce yourself unless greeted. Citizen''s own information: {citizen_context} Knowledge base context: {context} Question: {question}',
    [IsDefault] = 1,
    [UpdatedDate] = GETDATE()
WHERE [TemplateCode] = 'CITIZEN_INFO';
GO

-- ----------------------------------------------------------------------------
-- AI.PromptTemplate — NO_CONTEXT_FALLBACK: static reply used when no knowledge-base
-- chunk matches the citizen's question (ChatService skips the LLM call entirely in that
-- case, per product decision - avoids hallucinated answers). Editable by an AI Admin via
-- admin/prompt-templates without a code deploy. TemplateContent has no {context}/{question}
-- placeholders - it's shown verbatim.
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT [AI].[PromptTemplate] ON;
INSERT INTO [AI].[PromptTemplate] ([Id], [TemplateCode], [TemplateName], [Category], [TemplateContent], [Version], [IsDefault], [IsActive], [CreatedBy], [CreatedDate], [MarkedForDeletion], [MarkedForDeletionDate])
SELECT S.[Id], S.[TemplateCode], S.[TemplateName], NULL,
        N'I''m still learning and don''t have information on that yet. I''ve noted your question so our team can add it to my knowledge base - please try asking me something else in the meantime.',
        1, 0, 1, 1, GETDATE(), 0, NULL
FROM (VALUES (6, N'NO_CONTEXT_FALLBACK', N'No Context Fallback')) AS S ([Id], [TemplateCode], [TemplateName]);
SET IDENTITY_INSERT [AI].[PromptTemplate] OFF;
GO

-- ----------------------------------------------------------------------------
-- AI.PromptTemplate — INTENT_ROUTER: the AI Orchestrator's Semantic Router (Phase 2/6) classification
-- prompt. Editable by an AI Admin via admin/prompt-templates without a code deploy, same convention
-- as NO_CONTEXT_FALLBACK. Placeholders {intent_catalog}/{last_intent}/{last_route}/{last_entities}/
-- {message} are filled in by SemanticRouter.BuildPrompt - not by the generic {context}/{question}
-- substitution the CHAT-answering pipeline uses, since this template's job is classification, not
-- conversation. "steps" (Phase 6, MULTI_STEP) is populated only when the citizen's single message
-- expresses more than one request.
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT [AI].[PromptTemplate] ON;
INSERT INTO [AI].[PromptTemplate] ([Id], [TemplateCode], [TemplateName], [Category], [TemplateContent], [Version], [IsDefault], [IsActive], [CreatedBy], [CreatedDate], [MarkedForDeletion], [MarkedForDeletionDate])
SELECT S.[Id], S.[TemplateCode], S.[TemplateName], N'INTENT_ROUTER',
        N'You are the intent router for Karmitra, a municipal citizen-support chatbot. Classify the citizen''s message into exactly one of the intents listed below and respond with ONLY a single JSON object - no prose, no markdown fences - matching exactly this shape: {"route":string,"intent":string,"confidence":number between 0 and 1,"requiresAuthentication":boolean,"requiresAuthorization":boolean,"requiresConfirmation":boolean,"entities":object,"missingParameters":string[],"steps":[{"stepIndex":number,"route":string,"intent":string,"entities":object}],"reason":string}. Use route MULTI_STEP with a populated "steps" array ONLY when the citizen''s single message clearly expresses more than one request (e.g. "check my property tax and pay it"); leave "steps" empty otherwise. Use the conversation context below to resolve a follow-up message (e.g. "generate a report for that") to the correct intent/entities rather than classifying it as unknown. Available intents (code — route — description): {intent_catalog} Conversation context: last intent = {last_intent}, last route = {last_route}, last entities = {last_entities}. Citizen message: {message}',
        2, 1, 1, 1, GETDATE(), 0, NULL
FROM (VALUES (7, N'INTENT_ROUTER', N'Intent Router')) AS S ([Id], [TemplateCode], [TemplateName]);
SET IDENTITY_INSERT [AI].[PromptTemplate] OFF;
GO

-- ----------------------------------------------------------------------------
-- AI.McpToolSecurity — security-metadata overlay for the 8 real tools the PlayOnTest MCP server
-- exposes (confirmed live via tools/list against http://localhost:3939/mcp). Only run_testcase is
-- ever reachable from citizen chat today (via AI.ChatIntent.ToolName on ACTION-routed intents like
-- MAKE_PAYMENT) - the other 7 are test-authoring/analytics tools for a future staff/QA console, not
-- citizen-triggerable, but are still classified here so McpToolRegistry's catalog is complete rather
-- than silently fail-closed-by-absence for tools that do legitimately exist.
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT [AI].[McpToolSecurity] ON;
INSERT INTO [AI].[McpToolSecurity]
    ([Id], [ServerName], [ToolName], [RequiresAuthentication], [RequiresAuthorization],
     [RequiresConfirmation], [RiskLevel], [IsActive], [CreatedBy], [CreatedDate], [MarkedForDeletion], [MarkedForDeletionDate])
SELECT S.Id, S.ServerName, S.ToolName, S.RequiresAuthentication, S.RequiresAuthorization,
       S.RequiresConfirmation, S.RiskLevel, 1, 1, GETDATE(), 0, NULL
FROM (VALUES
    (1, 'PlayOnTest', 'run_testcase',        1, 1, 1, 'HIGH'),
    (2, 'PlayOnTest', 'list_testcases',      0, 0, 0, 'LOW'),
    (3, 'PlayOnTest', 'get_testcase',        0, 0, 0, 'LOW'),
    (4, 'PlayOnTest', 'get_analytics',       0, 0, 0, 'LOW'),
    (5, 'PlayOnTest', 'upload_testcase',     1, 1, 1, 'MEDIUM'),
    (6, 'PlayOnTest', 'delete_testcase',     1, 1, 1, 'HIGH'),
    (7, 'PlayOnTest', 'clear_analytics',     1, 1, 1, 'MEDIUM'),
    (8, 'PlayOnTest', 'generate_pdf_report', 0, 0, 0, 'LOW'),
    (9, 'ReportGeneration', 'generate_report', 1, 1, 0, 'LOW')
) AS S (Id, ServerName, ToolName, RequiresAuthentication, RequiresAuthorization, RequiresConfirmation, RiskLevel)
WHERE NOT EXISTS (SELECT 1 FROM [AI].[McpToolSecurity] M WHERE M.Id = S.Id OR (M.ServerName = S.ServerName AND M.ToolName = S.ToolName));
SET IDENTITY_INSERT [AI].[McpToolSecurity] OFF;
GO

-- ----------------------------------------------------------------------------
-- AI.ChatIntent — central intent catalog for the AI Orchestrator / Intelligent Router.
-- ToolServer/ToolName are left NULL here even for ACTION/REPORT intents - the actual PlayOnTest
-- AutomationScripts test-case filename (MAKE_PAYMENT etc.) and the ReportGeneration report-type key
-- are wired up in later phases once those tools/reports actually exist; seeding a ToolName that
-- points nowhere yet would be worse than leaving it NULL and failing closed (CLARIFICATION).
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT [AI].[ChatIntent] ON;
INSERT INTO [AI].[ChatIntent]
    ([Id], [IntentCode], [IntentName], [RouteType], [RequiresAuthentication],
     [RequiresAuthorization], [RequiresConfirmation], [RiskLevel], [McpToolSecurityId],
     [IsActive], [CreatedBy], [CreatedDate], [MarkedForDeletion], [MarkedForDeletionDate])
SELECT S.IntentId, S.IntentCode, S.IntentName, S.RouteType, S.RequiresAuthentication,
       S.RequiresAuthorization, S.RequiresConfirmation, S.RiskLevel, M.Id,
       1, 1, GETDATE(), 0, NULL
FROM (VALUES
    (1,  'GREETING',                      'Greeting',                       'CHAT_KB',       0, 0, 0, 'LOW',    CAST(NULL AS VARCHAR(100)), CAST(NULL AS VARCHAR(200))),
    (2,  'HELP',                          'Help',                           'CHAT_KB',       0, 0, 0, 'LOW',    NULL, NULL),
    (3,  'BOT_INTRODUCTION',              'Bot Introduction',               'CHAT_KB',       0, 0, 0, 'LOW',    NULL, NULL),
    (4,  'SERVICE_DISCOVERY',             'Service Discovery',              'CHAT_KB',       0, 0, 0, 'LOW',    NULL, NULL),
    (5,  'PROPERTY_TAX_INFORMATION',      'Property Tax Information',       'RAG',           0, 0, 0, 'LOW',    NULL, NULL),
    (6,  'WATER_TAX_INFORMATION',         'Water Tax Information',          'RAG',           0, 0, 0, 'LOW',    NULL, NULL),
    (7,  'PROPERTY_TRANSFER_INFORMATION','Property Transfer Information',  'RAG',           0, 0, 0, 'LOW',    NULL, NULL),
    (8,  'PAYMENT_INFORMATION',           'Payment Information',            'RAG',           0, 0, 0, 'LOW',    NULL, NULL),
    (9,  'GET_PROPERTY_DEMAND',           'Get Property Demand',           'DATA',          1, 1, 0, 'LOW',    NULL, NULL),
    (10, 'GET_PAYMENT_HISTORY',           'Get Payment History',           'DATA',          1, 1, 0, 'LOW',    NULL, NULL),
    (11, 'GET_PROPERTY_DETAILS',          'Get Property Details',          'DATA',          1, 1, 0, 'LOW',    NULL, NULL),
    (12, 'GET_WATER_BILL',                'Get Water Bill',                'DATA',          1, 1, 0, 'LOW',    NULL, NULL),
    (13, 'MAKE_PAYMENT',                  'Make Payment',                  'ACTION',        1, 1, 1, 'HIGH',   NULL, NULL),
    (14, 'ADD_COMPLAINT',                 'Add Complaint',                 'ACTION',        1, 0, 1, 'MEDIUM', NULL, NULL),
    (15, 'SUBMIT_APPLICATION',            'Submit Application',            'ACTION',        1, 0, 1, 'MEDIUM', NULL, NULL),
    (16, 'GENERATE_PROPERTY_TAX_REPORT',  'Generate Property Tax Report',  'REPORT',        1, 1, 0, 'LOW',    'ReportGeneration', 'generate_report'),
    (17, 'GENERATE_PAYMENT_REPORT',       'Generate Payment Report',       'REPORT',        1, 1, 0, 'LOW',    'ReportGeneration', 'generate_report'),
    (18, 'GENERATE_DEMAND_REPORT',        'Generate Demand Report',        'REPORT',        1, 1, 0, 'LOW',    'ReportGeneration', 'generate_report'),
    (19, 'GENERATE_WATER_BILL_REPORT',    'Generate Water Bill Report',    'REPORT',        1, 1, 0, 'LOW',    'ReportGeneration', 'generate_report'),
    (20, 'CLARIFICATION',                 'Clarification Needed',         'CLARIFICATION', 0, 0, 0, 'LOW',    NULL, NULL),
    (21, 'UNKNOWN',                       'Unknown / Unclassified',        'CLARIFICATION', 0, 0, 0, 'LOW',    NULL, NULL)
) AS S (IntentId, IntentCode, IntentName, RouteType, RequiresAuthentication,
        RequiresAuthorization, RequiresConfirmation, RiskLevel, ServerName, ToolName)
LEFT JOIN [AI].[McpToolSecurity] M ON M.ServerName = S.ServerName AND M.ToolName = S.ToolName
WHERE NOT EXISTS (SELECT 1 FROM [AI].[ChatIntent] I WHERE I.[Id] = S.IntentId OR I.IntentCode = S.IntentCode);
SET IDENTITY_INSERT [AI].[ChatIntent] OFF;
GO

-- Also fix tool FK for report intents that were already present before this seed.
UPDATE I SET I.McpToolSecurityId = M.Id
FROM [AI].[ChatIntent] I
JOIN [AI].[McpToolSecurity] M ON M.ServerName = 'ReportGeneration' AND M.ToolName = 'generate_report'
WHERE I.IntentCode IN ('GENERATE_PROPERTY_TAX_REPORT', 'GENERATE_PAYMENT_REPORT', 'GENERATE_DEMAND_REPORT', 'GENERATE_WATER_BILL_REPORT')
  AND I.McpToolSecurityId IS NULL;
GO
-- ----------------------------------------------------------------------------
-- AI.chatKnowledgebase — keyword FAQ suggestion rows (same content as scripts/seed_chatKnowledgebase.sql; that script supports existing databases).
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT [AI].[chatKnowledgebase] ON;
INSERT INTO [AI].[chatKnowledgebase]
    ([Id], [KeyWords], [Suggessions], [ResponseMsg], [NextCKBID],
     [ChatIntentId], [Priority], [MatchType], [CreatedBy])
SELECT S.CKBID, S.KeyWords, S.Suggessions,
       REPLACE(S.ResponseMsg, N'\n', NCHAR(10)), S.NextCKBID,
       I.[Id], S.Priority, 'KEYWORD', 1
FROM (VALUES
    (1, N'tax,property,property tax,pay,payment,online,कर,मालमत्ता,मालमत्ता कर,भरणे,ऑनलाइन,संपत्ति,संपत्ति कर,प्रॉपर्टी,टैक्स,भुगतान', N'How do I pay my property tax online?', N'You can pay your property tax online in a few steps:\n\n1. Open the ULB''s online citizen services portal.\n2. Choose **Property Tax → Pay Tax**.\n3. Search your property by **Property ID** (printed on your tax bill) or owner name and ward.\n4. Check the outstanding amount shown, then pay by UPI, card or net banking.\n5. Download the **receipt** after payment - keep it for your records.\n\nYou can also pay at any ULB citizen service centre. If the amount shown looks wrong, please contact the Help Desk before paying.', NULL, 'PAYMENT_INFORMATION', 10),
    (2, N'tax,property,property tax,due,dues,outstanding,arrears,demand,bill,कर,मालमत्ता,मालमत्ता कर,थकबाकी,थकीत,बिल,संपत्ति,संपत्ति कर,बकाया,प्रॉपर्टी,टैक्स', N'How can I check my property tax due amount?', N'To check how much property tax is due:\n\n1. Keep your **Property ID** ready (it is on your last tax bill or receipt).\n2. On the ULB citizen services portal, open **Property Tax → View Demand / Dues**.\n3. Enter the Property ID to see the current demand, arrears and any penalty.\n\nIf you are signed in to Karmitra, you can also ask *"show my property tax due"* and use the **Check Property Tax Due** service from **Browse services**.', NULL, 'GET_PROPERTY_DEMAND', 10),
    (3, N'tax,property,property tax,penalty,late,fine,interest,कर,मालमत्ता,मालमत्ता कर,दंड,विलंब,उशिरा,संपत्ति,संपत्ति कर,जुर्माना,पेनल्टी,प्रॉपर्टी,टैक्स', N'Is there a penalty for late property tax payment?', N'Yes - property tax that is not paid by the due date attracts a **penalty / interest** under the municipal tax rules, and it keeps adding up until the dues are cleared.\n\n- The exact rate and due date are set by your ULB and shown on your **tax bill**.\n- Paying before the due date avoids the penalty; some ULBs also give a **rebate** for early payment.\n- Any penalty already charged appears in your outstanding demand on the portal.\n\nFor the rate that applies to your property, please check your bill or ask the Help Desk.', NULL, 'PROPERTY_TAX_INFORMATION', 0),
    (4, N'transfer,mutation,transfer status,track transfer,हस्तांतरण,नामांतरण,फेरफार,स्थिती,स्थिति,ट्रांसफर', N'How long does property transfer take and how do I track it?', N'After you submit a property name transfer (mutation) application:\n\n1. You receive an **application / acknowledgement number** - keep it safe.\n2. The ULB verifies the documents and may issue a **public notice** inviting objections.\n3. If there are no objections, the new owner''s name is updated in the property tax records.\n\nTrack the progress on the citizen services portal using your application number, or ask the Help Desk. Processing time depends on your ULB and on whether objections are received.', NULL, 'PROPERTY_TRANSFER_INFORMATION', 0),
    (5, N'transfer,property,property transfer,mutation,name transfer,name change,documents,हस्तांतरण,नामांतरण,फेरफार,नाव बदल,कागदपत्रे,मालमत्ता,संपत्ति,प्रॉपर्टी,ट्रांसफर,दस्तावेज', N'What documents are needed for property name transfer?', N'To transfer a property into a new owner''s name (mutation), you usually need:\n\n- A filled **mutation / name transfer application** form\n- The registered **sale deed, gift deed, will or succession certificate** (whichever applies)\n- **Identity proof** and **address proof** of the new owner\n- The latest **property tax receipt** showing no dues\n- A **No Objection Certificate** from other legal heirs, where applicable\n\nYour ULB may ask for additional documents depending on the type of transfer.', 4, 'PROPERTY_TRANSFER_INFORMATION', 10),
    (6, N'water,water connection,connection,new connection,tap,पाणी,नळ,जोडणी,कनेक्शन,पानी,नल', N'How do I apply for a new water connection?', N'To apply for a new water (tap) connection:\n\n1. Choose the connection type - **Residential, Commercial or Institutional** - and the pipe size.\n2. Keep ready: **property tax receipt** (no dues), **ownership / occupancy proof**, **identity proof**, and a site plan if asked.\n3. Apply online through **Browse services → Request Water Connection** in Karmitra, or at the ULB water supply office.\n4. After a site inspection and payment of the connection charges, the connection is sanctioned.\n\nYou will get an application number to track your request.', NULL, 'SUBMIT_APPLICATION', 10),
    (7, N'water,water bill,water tax,bill,पाणी,पाणीपट्टी,पाणी बिल,पानी,पानी बिल,जल कर,बिल', N'How do I pay my water bill?', N'You can pay your water bill / water tax:\n\n1. **Online** - open the ULB citizen services portal, choose **Water → Pay Bill**, and enter your **consumer / connection number** (printed on the bill).\n2. **In person** - at any ULB citizen service centre or water supply office.\n\nDownload or collect the **receipt** after paying. If your bill looks higher than usual, report it to the Help Desk so the meter reading can be checked.', NULL, 'GET_WATER_BILL', 10),
    (8, N'water,water supply,supply,no water,leakage,leak,dirty water,pressure,पाणी,पुरवठा,गळती,पानी,सप्लाई,लीकेज', N'How do I report a water supply problem?', N'Sorry you are facing a water supply issue. To report it:\n\n1. In Karmitra, open **Browse services → File a Grievance** and choose **Water Supply**.\n2. Describe the problem (no supply, low pressure, leakage or dirty water) and add your **address / landmark**.\n3. Attach a photo if it helps.\n\nYou will get a **complaint number** to track the status. For an urgent leakage on a main line, also inform the ULB water supply office directly.', NULL, 'ADD_COMPLAINT', 10),
    (9, N'birth,birth certificate,certificate,जन्म,दाखला,प्रमाणपत्र,नोंदणी,पंजीकरण', N'How do I apply for a birth certificate?', N'To get a birth certificate:\n\n1. The birth must first be **registered** with the ULB - hospitals usually report births automatically; home births should be reported by the family.\n2. Apply on the ULB citizen services portal under **Birth & Death → Birth Certificate**, or at the civil registration office.\n3. Provide the **child''s name, date and place of birth, parents'' names** and your identity proof.\n4. Pay the certificate fee and download or collect the certificate.\n\nFor a late registration or a correction in the certificate, please contact the Help Desk.', NULL, 'SUBMIT_APPLICATION', 10),
    (10, N'death,death certificate,certificate,मृत्यू,मृत्यु,दाखला,प्रमाणपत्र,नोंदणी,पंजीकरण', N'How do I apply for a death certificate?', N'To get a death certificate:\n\n1. The death must be **registered** with the ULB - hospitals usually report it; otherwise a family member reports it to the civil registration office.\n2. Apply on the ULB citizen services portal under **Birth & Death → Death Certificate**, or at the office.\n3. Provide the **deceased person''s name, date and place of death**, the applicant''s identity proof and relationship.\n4. Pay the certificate fee and download or collect the certificate.\n\nFor a delayed registration or a correction, please contact the Help Desk.', NULL, 'SUBMIT_APPLICATION', 10),
    (11, N'building,building permission,construction,permission,plan approval,बांधकाम,परवानगी,नकाशा,भवन,निर्माण,अनुमति,बिल्डिंग,नक्शा', N'What documents are needed for building permission?', N'For building / construction permission you usually need:\n\n- **Ownership documents** of the plot (sale deed, 7/12 extract or property card)\n- **Building plans** prepared and signed by a licensed architect / engineer\n- **Site plan** and location map\n- The latest **property tax receipt** showing no dues\n- **No Objection Certificates** where required (for example fire, or other authorities)\n\nSubmit the application through the ULB''s building permission system or town planning office. The exact list depends on the plot size and type of construction.', NULL, 'SUBMIT_APPLICATION', 10),
    (12, N'complaint,grievance,register complaint,file complaint,तक्रार,शिकायत', N'How do I file a complaint / grievance?', N'You can file a complaint right here:\n\n1. Open **Browse services → File a Grievance**.\n2. Pick the category - **Water Supply, Roads & Infrastructure, Sanitation & Waste** or **Other**.\n3. Describe the issue and give the **address / landmark**. Add a photo if you have one.\n4. Submit to get a **complaint number**.\n\nUse the complaint number to track progress later.', NULL, 'ADD_COMPLAINT', 10),
    (13, N'complaint,grievance,status,complaint status,track complaint,तक्रार,स्थिती,शिकायत,स्थिति,स्टेटस', N'How can I track my complaint status?', N'To check the status of a complaint:\n\n- **Signed in to Karmitra?** Open **My Requests** from the menu to see all your complaints and their current status.\n- Otherwise, use your **complaint number** on the ULB citizen services portal.\n\nIf a complaint has been pending longer than expected, reply here and ask to talk to the Help Desk.', NULL, 'ADD_COMPLAINT', 10)
) AS S (CKBID, KeyWords, Suggessions, ResponseMsg, NextCKBID,
        IntentCode, Priority)
INNER JOIN [AI].[ChatIntent] I ON I.IntentCode = S.IntentCode
WHERE NOT EXISTS (SELECT 1 FROM [AI].[chatKnowledgebase] K WHERE K.[Id] = S.CKBID OR K.Suggessions = S.Suggessions);
SET IDENTITY_INSERT [AI].[chatKnowledgebase] OFF;
GO

-- ----------------------------------------------------------------------------
-- AI.CitizenContextFieldMetadata — describes every v1 AI.vw_CitizenContext column EXCEPT
-- CitizenId (internal join key) and ResultReferenceType (internal plumbing) - those two are
-- deliberately left undescribed, the worked example of "a column with no active metadata row
-- is silently excluded from the LLM prompt."
--
-- PRIVACY: mobile number and email are NOT part of AI.vw_CitizenContext at all; they live in the access-restricted
-- AI.vw_CitizenContactDetails, so there is no metadata row (and no way to enable one) for them here. The default chat/router
-- model is a cloud-hosted model, so sending direct identifiers on every citizen-context request is not
-- acceptable by default. GrievanceResolutionNotes is seeded INACTIVE (IsActive = 0): it is staff-authored and
-- has no citizen-visible/internal split, so keep it off until a reviewed citizen-safe field exists.
-- (Ids 2 and 3 were the removed mobile/email rows and are intentionally not reused.)
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT [AI].[CitizenContextFieldMetadata] ON;
INSERT INTO [AI].[CitizenContextFieldMetadata] ([Id], [ColumnName], [FieldLabel], [FieldDescription], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate], [MarkedForDeletion], [MarkedForDeletionDate])
SELECT S.[Id], S.[ColumnName], S.[FieldLabel], S.[FieldDescription], S.[DisplayOrder], S.[IsActive], 1, GETDATE(), 0, NULL
FROM (VALUES
    (1, N'CitizenFullName',          N'Full Name',              N'The citizen''s registered full name.',                                                     0, 1),
    (4, N'CitizenLanguage',          N'Preferred Language',      N'The citizen''s preferred language.',                                                       3, 1),
    (5, N'RequestType',              N'Request Type',            N'The name of the guided-flow service the citizen used (e.g. "File a Grievance").',          4, 1),
    (6, N'SubmissionSummary',        N'Summary',                 N'A short subject/summary the citizen entered for this request, if one was captured.',       5, 1),
    (7, N'SubmissionStatus',         N'Submission Status',       N'PENDING_REVIEW (not yet processed) or PROCESSED (a result record now exists).',             6, 1),
    (8, N'SubmittedDate',            N'Submitted On',            N'The date/time the citizen submitted this request.',                                        7, 1),
    (9, N'GrievanceStatus',          N'Grievance Status',        N'Current lifecycle stage of a filed complaint: NEW, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED, or ESCALATED.', 8, 1),
    (10, N'GrievanceResolutionNotes', N'Resolution Notes',        N'Staff notes on how a resolved/closed grievance was handled, if any.',                       9, 0),
    (11, N'GrievanceResolvedDate',    N'Resolved On',             N'The date/time a grievance was marked resolved, if it has been.',                            10, 1)
) AS S ([Id], [ColumnName], [FieldLabel], [FieldDescription], [DisplayOrder], [IsActive]);
SET IDENTITY_INSERT [AI].[CitizenContextFieldMetadata] OFF;
GO

-- ----------------------------------------------------------------------------
-- AI.GuidedFlow — sample "File a Grievance" flow (proves the guided-flow engine
-- end-to-end): LOGIN (sign in required) -> MENU (pick category) -> FORM
-- (complaint details) -> ACTION (creates a real CORE.Grievance row via
-- GrievanceSubmissionActionHandler) -> MESSAGE (done).
-- Fixed seed IDs; dependent nodes are inserted before their references.
-- ----------------------------------------------------------------------------

SET IDENTITY_INSERT [AI].[GuidedFlow] ON;
INSERT INTO [AI].[GuidedFlow] ([Id], [FlowCode], [FlowName], [Description], [DisplayOrder], [IsActive])
VALUES (1, 'FILE_GRIEVANCE', 'File a Grievance', 'Report a civic issue (water, roads, sanitation, etc.) as a tracked complaint.', 0, 1);
SET IDENTITY_INSERT [AI].[GuidedFlow] OFF;

    -- Node 4 first (MESSAGE, no forward references) so earlier nodes can point at it.
SET IDENTITY_INSERT [AI].[GuidedFlowNode] ON;
INSERT INTO [AI].[GuidedFlowNode] ([Id], [GuidedFlowId], [NodeType], [Title], [BodyText], [DisplayOrder])
VALUES (1, 1, 'MESSAGE', 'Complaint filed', 'Thank you! Your complaint has been filed and our team will get back to you soon.', 4);
SET IDENTITY_INSERT [AI].[GuidedFlowNode] OFF;

SET IDENTITY_INSERT [AI].[GuidedFlowNode] ON;
INSERT INTO [AI].[GuidedFlowNode] ([Id], [GuidedFlowId], [NodeType], [Title], [BodyText], [NextNodeId], [DisplayOrder])
VALUES (2, 1, 'ACTION', 'Submit complaint', 'Submitting your complaint...', 1, 3);
SET IDENTITY_INSERT [AI].[GuidedFlowNode] OFF;

SET IDENTITY_INSERT [AI].[GuidedFlowNode] ON;
INSERT INTO [AI].[GuidedFlowNode] ([Id], [GuidedFlowId], [NodeType], [Title], [BodyText], [NextNodeId], [DisplayOrder])
VALUES (3, 1, 'FORM', 'Complaint details', 'Please provide the details of your complaint.', 2, 2);
SET IDENTITY_INSERT [AI].[GuidedFlowNode] OFF;

SET IDENTITY_INSERT [AI].[GuidedFlowNode] ON;
INSERT INTO [AI].[GuidedFlowNode] ([Id], [GuidedFlowId], [NodeType], [Title], [BodyText], [ResultFieldCode], [DisplayOrder])
VALUES (4, 1, 'MENU', 'Grievance category', 'What type of issue would you like to report?', 'GrievanceCategory', 1);
SET IDENTITY_INSERT [AI].[GuidedFlowNode] OFF;

    -- LOGIN gates the whole flow - a citizen must sign in (OTP/MPIN) before filing a grievance,
    -- so the created record can genuinely be attributed to them (see GuidedFlowSubmission.CitizenId).
SET IDENTITY_INSERT [AI].[GuidedFlowNode] ON;
INSERT INTO [AI].[GuidedFlowNode] ([Id], [GuidedFlowId], [NodeType], [Title], [BodyText], [NextNodeId], [DisplayOrder])
VALUES (5, 1, 'LOGIN', 'Sign in required', 'Please sign in to file a grievance so we can keep you updated on its status.', 4, 0);
SET IDENTITY_INSERT [AI].[GuidedFlowNode] OFF;

    UPDATE [AI].[GuidedFlow] SET [StartNodeId] = 5 WHERE [Id] = 1;

SET IDENTITY_INSERT [AI].[GuidedFlowNodeOption] ON;
INSERT INTO [AI].[GuidedFlowNodeOption] ([Id], [GuidedFlowNodeId], [OptionLabel], [OptionValue], [NextNodeId], [DisplayOrder])
VALUES (1, 4, 'Water Supply', 'WATER_SUPPLY', 3, 0),
        (2, 4, 'Roads & Infrastructure', 'ROADS_INFRASTRUCTURE', 3, 1),
        (3, 4, 'Sanitation & Waste', 'SANITATION_WASTE', 3, 2),
        (4, 4, 'Other', 'OTHER', 3, 3);
SET IDENTITY_INSERT [AI].[GuidedFlowNodeOption] OFF;

SET IDENTITY_INSERT [AI].[GuidedFlowFormField] ON;
INSERT INTO [AI].[GuidedFlowFormField] ([Id], [GuidedFlowNodeId], [FieldCode], [FieldLabel], [FieldType], [IsRequired], [DisplayOrder])
VALUES (1, 3, 'ComplainantName', 'Your name', 'TEXT', 1, 0),
        (2, 3, 'ComplainantMobile', 'Mobile number', 'TEXT', 1, 1),
        (3, 3, 'Subject', 'Subject', 'TEXT', 1, 2),
        (4, 3, 'Description', 'Describe the issue', 'TEXTAREA', 1, 3),
        (5, 3, 'Address', 'Location / address', 'TEXT', 1, 4);
SET IDENTITY_INSERT [AI].[GuidedFlowFormField] OFF;

SET IDENTITY_INSERT [AI].[GuidedFlowActionConfig] ON;
INSERT INTO [AI].[GuidedFlowActionConfig] ([Id], [GuidedFlowNodeId], [ActionType], [ConfigJson])
VALUES (1, 2, 'GRIEVANCE_SUBMISSION', '{}');
SET IDENTITY_INSERT [AI].[GuidedFlowActionConfig] OFF;
GO

-- ----------------------------------------------------------------------------
-- AI.GuidedFlow — sample "Check Property Tax Due" flow (demonstrates a real
-- DECISION node with a numeric ConditionExpression, plus NUMBER/DATE/SELECT
-- form field types - none of which FILE_GRIEVANCE above exercises).
-- Fixed seed IDs; dependent nodes are inserted before their references.
-- ----------------------------------------------------------------------------

SET IDENTITY_INSERT [AI].[GuidedFlow] ON;
INSERT INTO [AI].[GuidedFlow] ([Id], [FlowCode], [FlowName], [Description], [DisplayOrder], [IsActive])
VALUES (2, 'CHECK_PROPERTY_TAX_DUE', 'Check Property Tax Due', 'Check whether your property tax outstanding balance needs attention.', 1, 0);
SET IDENTITY_INSERT [AI].[GuidedFlow] OFF;

    -- Build back-to-front so NextNodeId can always reference an already-created row.
SET IDENTITY_INSERT [AI].[GuidedFlowNode] ON;
INSERT INTO [AI].[GuidedFlowNode] ([Id], [GuidedFlowId], [NodeType], [Title], [BodyText], [DisplayOrder])
VALUES (6, 2, 'MESSAGE', 'Thank you', 'Thank you for checking - our team has logged your inquiry.', 5);
SET IDENTITY_INSERT [AI].[GuidedFlowNode] OFF;

SET IDENTITY_INSERT [AI].[GuidedFlowNode] ON;
INSERT INTO [AI].[GuidedFlowNode] ([Id], [GuidedFlowId], [NodeType], [Title], [BodyText], [NextNodeId], [DisplayOrder])
VALUES (7, 2, 'ACTION', 'Log inquiry', 'Logging your inquiry...', 6, 4);
SET IDENTITY_INSERT [AI].[GuidedFlowNode] OFF;

SET IDENTITY_INSERT [AI].[GuidedFlowNode] ON;
INSERT INTO [AI].[GuidedFlowNode] ([Id], [GuidedFlowId], [NodeType], [Title], [BodyText], [NextNodeId], [DisplayOrder])
VALUES (8, 2, 'MESSAGE', 'Low or no outstanding balance', 'Your outstanding balance appears to be low or already cleared. No immediate action is needed.', 7, 3);
SET IDENTITY_INSERT [AI].[GuidedFlowNode] OFF;

SET IDENTITY_INSERT [AI].[GuidedFlowNode] ON;
INSERT INTO [AI].[GuidedFlowNode] ([Id], [GuidedFlowId], [NodeType], [Title], [BodyText], [NextNodeId], [DisplayOrder])
VALUES (9, 2, 'MESSAGE', 'High outstanding balance', 'Your outstanding balance is significant. Payment and installment options are available at the ULB office.', 7, 2);
SET IDENTITY_INSERT [AI].[GuidedFlowNode] OFF;

SET IDENTITY_INSERT [AI].[GuidedFlowNode] ON;
INSERT INTO [AI].[GuidedFlowNode] ([Id], [GuidedFlowId], [NodeType], [Title], [BodyText], [DisplayOrder])
VALUES (10, 2, 'DECISION', 'Evaluate due amount', NULL, 1);
SET IDENTITY_INSERT [AI].[GuidedFlowNode] OFF;

SET IDENTITY_INSERT [AI].[GuidedFlowNode] ON;
INSERT INTO [AI].[GuidedFlowNode] ([Id], [GuidedFlowId], [NodeType], [Title], [BodyText], [NextNodeId], [DisplayOrder])
VALUES (11, 2, 'FORM', 'Property details', 'Please provide your property details.', 10, 0);
SET IDENTITY_INSERT [AI].[GuidedFlowNode] OFF;

    UPDATE [AI].[GuidedFlow] SET [StartNodeId] = 11 WHERE [Id] = 2;

    -- DisplayOrder matters here: the engine evaluates DECISION options in order and picks the
    -- first one whose ConditionExpression is blank or true - the real condition MUST come before
    -- the blank catch-all, or the catch-all would always win.
SET IDENTITY_INSERT [AI].[GuidedFlowNodeOption] ON;
INSERT INTO [AI].[GuidedFlowNodeOption] ([Id], [GuidedFlowNodeId], [OptionLabel], [OptionValue], [NextNodeId], [ConditionExpression], [DisplayOrder])
VALUES (5, 10, 'High due', 'HIGH', 9, 'OutstandingAmount > 5000', 0),
        (6, 10, 'Low or no due', 'LOW', 8, NULL, 1);
SET IDENTITY_INSERT [AI].[GuidedFlowNodeOption] OFF;

SET IDENTITY_INSERT [AI].[GuidedFlowFormField] ON;
INSERT INTO [AI].[GuidedFlowFormField] ([Id], [GuidedFlowNodeId], [FieldCode], [FieldLabel], [FieldType], [IsRequired], [SelectOptionsJson], [DisplayOrder])
VALUES (6, 11, 'PropertyId', 'Property ID', 'TEXT', 1, NULL, 0),
        (7, 11, 'Ward', 'Ward', 'SELECT', 1, '[{"label":"Ward 1","value":"WARD_1"},{"label":"Ward 2","value":"WARD_2"},{"label":"Ward 3","value":"WARD_3"}]', 1),
        (8, 11, 'AssessmentYear', 'Assessment year', 'SELECT', 1, '[{"label":"2023-24","value":"2023-24"},{"label":"2024-25","value":"2024-25"},{"label":"2025-26","value":"2025-26"},{"label":"2026-27","value":"2026-27"}]', 2),
        (9, 11, 'OutstandingAmount', 'Outstanding amount (as per last bill)', 'NUMBER', 1, NULL, 3),
        (10, 11, 'LastPaidDate', 'Last paid date', 'DATE', 0, NULL, 4);
SET IDENTITY_INSERT [AI].[GuidedFlowFormField] OFF;

SET IDENTITY_INSERT [AI].[GuidedFlowActionConfig] ON;
INSERT INTO [AI].[GuidedFlowActionConfig] ([Id], [GuidedFlowNodeId], [ActionType], [ConfigJson])
VALUES (2, 7, 'GENERIC_STORAGE', '{}');
SET IDENTITY_INSERT [AI].[GuidedFlowActionConfig] OFF;
GO

-- ----------------------------------------------------------------------------
-- AI.GuidedFlow — sample "Request a New Water Connection" flow (demonstrates
-- MENU -> FORM with SELECT/NUMBER/DATE field types feeding a generic action).
-- Fixed seed IDs; dependent nodes are inserted before their references.
-- ----------------------------------------------------------------------------

SET IDENTITY_INSERT [AI].[GuidedFlow] ON;
INSERT INTO [AI].[GuidedFlow] ([Id], [FlowCode], [FlowName], [Description], [DisplayOrder], [IsActive])
VALUES (3, 'REQUEST_WATER_CONNECTION', 'Request a New Water Connection', 'Apply for a new residential, commercial, or institutional water connection.', 2, 1);
SET IDENTITY_INSERT [AI].[GuidedFlow] OFF;

SET IDENTITY_INSERT [AI].[GuidedFlowNode] ON;
INSERT INTO [AI].[GuidedFlowNode] ([Id], [GuidedFlowId], [NodeType], [Title], [BodyText], [DisplayOrder])
VALUES (12, 3, 'MESSAGE', 'Application received', 'Thank you! Your water connection request has been received and our team will process it shortly.', 3);
SET IDENTITY_INSERT [AI].[GuidedFlowNode] OFF;

SET IDENTITY_INSERT [AI].[GuidedFlowNode] ON;
INSERT INTO [AI].[GuidedFlowNode] ([Id], [GuidedFlowId], [NodeType], [Title], [BodyText], [NextNodeId], [DisplayOrder])
VALUES (13, 3, 'ACTION', 'Submit application', 'Submitting your application...', 12, 2);
SET IDENTITY_INSERT [AI].[GuidedFlowNode] OFF;

SET IDENTITY_INSERT [AI].[GuidedFlowNode] ON;
INSERT INTO [AI].[GuidedFlowNode] ([Id], [GuidedFlowId], [NodeType], [Title], [BodyText], [NextNodeId], [DisplayOrder])
VALUES (14, 3, 'FORM', 'Applicant & connection details', 'Please provide the applicant and connection details.', 13, 1);
SET IDENTITY_INSERT [AI].[GuidedFlowNode] OFF;

SET IDENTITY_INSERT [AI].[GuidedFlowNode] ON;
INSERT INTO [AI].[GuidedFlowNode] ([Id], [GuidedFlowId], [NodeType], [Title], [BodyText], [ResultFieldCode], [DisplayOrder])
VALUES (15, 3, 'MENU', 'Connection type', 'What type of water connection do you need?', 'ConnectionType', 0);
SET IDENTITY_INSERT [AI].[GuidedFlowNode] OFF;

    UPDATE [AI].[GuidedFlow] SET [StartNodeId] = 15 WHERE [Id] = 3;

SET IDENTITY_INSERT [AI].[GuidedFlowNodeOption] ON;
INSERT INTO [AI].[GuidedFlowNodeOption] ([Id], [GuidedFlowNodeId], [OptionLabel], [OptionValue], [NextNodeId], [DisplayOrder])
VALUES (7, 15, 'Residential', 'RESIDENTIAL', 14, 0),
        (8, 15, 'Commercial', 'COMMERCIAL', 14, 1),
        (9, 15, 'Institutional', 'INSTITUTIONAL', 14, 2);
SET IDENTITY_INSERT [AI].[GuidedFlowNodeOption] OFF;

SET IDENTITY_INSERT [AI].[GuidedFlowFormField] ON;
INSERT INTO [AI].[GuidedFlowFormField] ([Id], [GuidedFlowNodeId], [FieldCode], [FieldLabel], [FieldType], [IsRequired], [SelectOptionsJson], [DisplayOrder])
VALUES (11, 14, 'ApplicantName', 'Applicant name', 'TEXT', 1, NULL, 0),
        (12, 14, 'MobileNumber', 'Mobile number', 'TEXT', 1, NULL, 1),
        (13, 14, 'Address', 'Address', 'TEXTAREA', 1, NULL, 2),
        (14, 14, 'PropertyOwnership', 'Property ownership', 'SELECT', 1, '[{"label":"Owned","value":"OWNED"},{"label":"Rented","value":"RENTED"}]', 3),
        (15, 14, 'PipeSizeRequired', 'Pipe size required', 'SELECT', 1, '[{"label":"15mm","value":"15MM"},{"label":"20mm","value":"20MM"},{"label":"25mm","value":"25MM"}]', 4),
        (16, 14, 'NumberOfTaps', 'Number of taps', 'NUMBER', 1, NULL, 5),
        (17, 14, 'PreferredConnectionDate', 'Preferred connection date', 'DATE', 0, NULL, 6);
SET IDENTITY_INSERT [AI].[GuidedFlowFormField] OFF;

SET IDENTITY_INSERT [AI].[GuidedFlowActionConfig] ON;
INSERT INTO [AI].[GuidedFlowActionConfig] ([Id], [GuidedFlowNodeId], [ActionType], [ConfigJson])
VALUES (3, 13, 'GENERIC_STORAGE', '{}');
SET IDENTITY_INSERT [AI].[GuidedFlowActionConfig] OFF;
GO

-- ----------------------------------------------------------------------------
-- AI.EvaluationCase — starter golden set for RouterEvaluator/ToolEvaluator/RagEvaluator (Phase 9),
-- taken directly from the architecture spec's own example evaluation dataset. Deliberately small -
-- this is a seed to prove the harness works end-to-end, not a substitute for a real labeled set
-- built from actual traffic once the orchestrator has seen production use.
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT [AI].[EvaluationCase] ON;
INSERT INTO [AI].[EvaluationCase] ([Id], [Question], [ExpectedRouteType], [ExpectedChatIntentId], [ExpectedMcpToolSecurityId], [IsActive], [CreatedBy], [CreatedDate], [MarkedForDeletion], [MarkedForDeletionDate])
SELECT S.[Id], S.[Question], S.[ExpectedRouteType], I.[Id], M.[Id], 1, 1, GETDATE(), 0, NULL
FROM (VALUES
    (1, N'Hello', N'CHAT_KB', N'GREETING', CAST(NULL AS VARCHAR(100)), CAST(NULL AS VARCHAR(200))),
    (2, N'What documents are required for property transfer?', N'RAG', N'PROPERTY_TRANSFER_INFORMATION', NULL, NULL),
    (3, N'How is property tax calculated?', N'RAG', N'PROPERTY_TAX_INFORMATION', NULL, NULL),
    (4, N'Show my outstanding property tax', N'DATA', N'GET_PROPERTY_DEMAND', NULL, NULL),
    (5, N'What is my payment history?', N'DATA', N'GET_PAYMENT_HISTORY', NULL, NULL),
    (6, N'Pay my property tax', N'ACTION', N'MAKE_PAYMENT', NULL, NULL),
    (7, N'I want to file a complaint about a pothole', N'ACTION', N'ADD_COMPLAINT', NULL, NULL),
    (8, N'Generate my payment history report', N'REPORT', N'GENERATE_PAYMENT_REPORT', N'ReportGeneration', N'generate_report'),
    (9, N'Generate my property tax report', N'REPORT', N'GENERATE_PROPERTY_TAX_REPORT', N'ReportGeneration', N'generate_report'),
    (10, N'I want to pay', N'CLARIFICATION', N'UNKNOWN', NULL, NULL)
) AS S ([Id], [Question], [ExpectedRouteType], [ExpectedIntentCode], [ExpectedToolServer], [ExpectedToolName])
LEFT JOIN [AI].[ChatIntent] I ON I.[IntentCode] = S.[ExpectedIntentCode]
LEFT JOIN [AI].[McpToolSecurity] M ON M.[ServerName] = S.[ExpectedToolServer] AND M.[ToolName] = S.[ExpectedToolName];
SET IDENTITY_INSERT [AI].[EvaluationCase] OFF;
GO
