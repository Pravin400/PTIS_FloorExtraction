SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/****** Object:  Table [AI].[UserDetails] ******/
-- AI-specific profile/auth details for a citizen. Identity (name, mobile, verified flag, last login)
-- lives in [CORE].[CitizenMaster]; OTP challenges live in [CORE].[CitizenOtpLog] (Purpose e.g. 'LOGIN','REGISTRATION', 'MPIN_RESET'). One row per citizen.
CREATE TABLE [AI].[UserDetails](
    [Id]                        INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [CitizenId]                 INT NOT NULL,
    [Email]                     NVARCHAR(100) NULL,
    [Language]                  NVARCHAR(50) NULL,
    [MPinHash]                  NVARCHAR(255) NULL,
    [MPinSetDate]               DATETIME NULL,
    [MPinExpiryDate]            DATETIME NULL,
    [MPinFailedAttemptCount]    INT NOT NULL CONSTRAINT [DF_UserDetails_MPinFailedAttemptCount] DEFAULT (0),
    [MPinLockedUntilAt]         DATETIME NULL,
    [ProfileImageStoragePath]   NVARCHAR(500) NULL,
    [ProfileImageMimeType]      VARCHAR(100) NULL,
    [IsActive]                  BIT NOT NULL CONSTRAINT [DF_UserDetails_IsActive] DEFAULT (1),
    [CreatedBy]                 INT NULL,
    [CreatedDate]               DATETIME NOT NULL CONSTRAINT [DF_UserDetails_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]                 INT NULL,
    [UpdatedDate]               DATETIME NULL,
    [MarkedForDeletion]         BIT NOT NULL CONSTRAINT [DF_UserDetails_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]     DATETIME NULL,
    CONSTRAINT [PK_UserDetails] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_UserDetails_CitizenId] UNIQUE ([CitizenId]),
    CONSTRAINT [FK_UserDetails_CitizenMaster] FOREIGN KEY ([CitizenId]) REFERENCES [CORE].[CitizenMaster] ([Id]),
    CONSTRAINT [CK_UserDetails_MPinFailedAttemptCount] CHECK ([MPinFailedAttemptCount] >= 0),
    CONSTRAINT [CK_UserDetails_MPinDateRange] CHECK ([MPinSetDate] IS NULL OR [MPinExpiryDate] IS NULL OR [MPinExpiryDate] >= [MPinSetDate]),
    CONSTRAINT [CK_UserDetails_MPinDatesRequireHash] CHECK ([MPinHash] IS NOT NULL OR ([MPinSetDate] IS NULL AND [MPinExpiryDate] IS NULL AND [MPinLockedUntilAt] IS NULL))    
);
GO

/****** Object:  Table [AI].[QuestionCategory] ******/
CREATE TABLE [AI].[QuestionCategory](
    [Id]                      INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [CategoryCode]            VARCHAR(50) NOT NULL,
    [CategoryName]            NVARCHAR(150) NOT NULL,
    [CategoryNameLocal]       NVARCHAR(200) NULL,
    [ParentCategoryId]        INT NULL,
    [Description]             NVARCHAR(500) NULL,
    [DisplayOrder]            INT NOT NULL CONSTRAINT [DF_QuestionCategory_DisplayOrder] DEFAULT (0),
    [IsActive]                BIT NOT NULL CONSTRAINT [DF_QuestionCategory_IsActive] DEFAULT (1),
    [CreatedBy]               INT NULL,
    [CreatedDate]             DATETIME NOT NULL CONSTRAINT [DF_QuestionCategory_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]               INT NULL,
    [UpdatedDate]             DATETIME NULL,
    [MarkedForDeletion]       BIT NOT NULL CONSTRAINT [DF_QuestionCategory_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]   DATETIME NULL,
    CONSTRAINT [PK_QuestionCategory] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_QuestionCategory_CategoryCode] UNIQUE ([CategoryCode]),
    CONSTRAINT [UQ_QuestionCategory_CategoryName] UNIQUE ([CategoryName]),
    CONSTRAINT [CK_QuestionCategory_ParentNotSelf] CHECK ([ParentCategoryId] IS NULL OR [ParentCategoryId] <> [Id]),
    CONSTRAINT [FK_QuestionCategory_ParentCategoryId] FOREIGN KEY ([ParentCategoryId]) REFERENCES [AI].[QuestionCategory] ([Id])
);
GO
CREATE NONCLUSTERED INDEX [IX_QuestionCategory_ParentCategoryId] ON [AI].[QuestionCategory] ([ParentCategoryId] ASC);
GO
CREATE OR ALTER TRIGGER [AI].[TR_QuestionCategory_PreventCycles] ON [AI].[QuestionCategory]
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    -- Validate only when the parent relationship changes.
    -- UPDATE() also returns TRUE for INSERT statements.
    IF NOT UPDATE(ParentCategoryId)
        RETURN;

    DECLARE @HasCycle BIT = 0;

    ;WITH CategoryHierarchy AS
    (
        -- Start from every inserted or updated category.
        SELECT
            I.Id AS StartId,
            I.ParentCategoryId AS ParentId,
            CAST(
                '|' + CAST(I.Id AS VARCHAR(11)) + '|'
                AS VARCHAR(MAX)
            ) AS VisitedPath,
            CAST(0 AS BIT) AS HasCycle
        FROM inserted I
        WHERE I.ParentCategoryId IS NOT NULL

        UNION ALL

        -- Follow the hierarchy upwards.
        SELECT
            H.StartId,
            P.ParentCategoryId,
            CAST(
                H.VisitedPath +
                CAST(P.Id AS VARCHAR(11)) + '|'
                AS VARCHAR(MAX)
            ),
            CAST(
                CASE
                    WHEN CHARINDEX(
                        '|' + CAST(P.Id AS VARCHAR(11)) + '|',
                        H.VisitedPath
                    ) > 0
                    THEN 1
                    ELSE 0
                END
                AS BIT
            )
        FROM CategoryHierarchy H
        INNER JOIN [AI].[QuestionCategory] P
            WITH (UPDLOCK, HOLDLOCK)
            ON P.Id = H.ParentId
        WHERE H.HasCycle = 0
    )
    SELECT TOP (1)
        @HasCycle = 1
    FROM CategoryHierarchy
    WHERE HasCycle = 1
    OPTION (MAXRECURSION 0);

    IF @HasCycle = 1
    BEGIN
        THROW 51001,
            'Circular hierarchy detected. A category cannot be its own ancestor.',
            1;
    END
END;
GO

/****** Object:  Table [AI].[McpToolSecurity] ******/
-- Authoritative MCP tool registry: the ONLY place a (ServerName, ToolName) pair is spelled out.
-- Other tables (AI.ChatIntent, AI.EvaluationCase) reference a tool by McpToolSecurity.Id and must not copy the names.
CREATE TABLE [AI].[McpToolSecurity](
    [Id]                        INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ServerName]                VARCHAR(100) NOT NULL,
    [ToolName]                  VARCHAR(200) NOT NULL,
    [RequiresAuthentication]    BIT NOT NULL CONSTRAINT [DF_McpToolSecurity_RequiresAuthentication] DEFAULT (0),
    [RequiresAuthorization]     BIT NOT NULL CONSTRAINT [DF_McpToolSecurity_RequiresAuthorization] DEFAULT (0),
    [RequiresConfirmation]      BIT NOT NULL CONSTRAINT [DF_McpToolSecurity_RequiresConfirmation] DEFAULT (0),
    [RiskLevel]                 VARCHAR(20) NOT NULL CONSTRAINT [DF_McpToolSecurity_RiskLevel] DEFAULT ('MEDIUM'),
    [IsActive]                  BIT NOT NULL CONSTRAINT [DF_McpToolSecurity_IsActive] DEFAULT (1),
    [CreatedBy]                 INT NULL,
    [CreatedDate]               DATETIME NOT NULL CONSTRAINT [DF_McpToolSecurity_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]                 INT NULL,
    [UpdatedDate]               DATETIME NULL,
    [MarkedForDeletion]         BIT NOT NULL CONSTRAINT [DF_McpToolSecurity_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]     DATETIME NULL,
    CONSTRAINT [PK_McpToolSecurity] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_McpToolSecurity_ServerName_ToolName] UNIQUE ([ServerName], [ToolName]),
    CONSTRAINT [CK_McpToolSecurity_RiskLevel] CHECK ([RiskLevel] IN ('LOW','MEDIUM','HIGH','CRITICAL'))
);
GO

/****** Object: Table [AI].[ChatIntent] ******/
CREATE TABLE [AI].[ChatIntent](
    [Id]                        INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [IntentCode]                VARCHAR(100) NOT NULL,
    [IntentName]                NVARCHAR(200) NOT NULL,
    [Description]               NVARCHAR(1000) NULL,
    [RouteType]                 VARCHAR(20) NOT NULL,
    [RequiresAuthentication]    BIT NOT NULL CONSTRAINT [DF_ChatIntent_RequiresAuthentication] DEFAULT (0),
    [RequiresAuthorization]     BIT NOT NULL CONSTRAINT [DF_ChatIntent_RequiresAuthorization] DEFAULT (0),
    [RequiresConfirmation]      BIT NOT NULL CONSTRAINT [DF_ChatIntent_RequiresConfirmation] DEFAULT (0),
    [RiskLevel]                 VARCHAR(20) NULL,
    [McpToolSecurityId]         INT NULL,
    [IsActive]                  BIT NOT NULL CONSTRAINT [DF_ChatIntent_IsActive] DEFAULT (1),
    [CreatedBy]                 INT NULL,
    [CreatedDate]               DATETIME NOT NULL CONSTRAINT [DF_ChatIntent_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]                 INT NULL,
    [UpdatedDate]               DATETIME NULL,
    [MarkedForDeletion]         BIT NOT NULL CONSTRAINT [DF_ChatIntent_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]     DATETIME NULL,
    CONSTRAINT [PK_ChatIntent] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_ChatIntent_IntentCode] UNIQUE ([IntentCode]),
    -- Target for composite FKs that must prove an intent has a given route type (e.g. EvaluationCase).
    CONSTRAINT [UQ_ChatIntent_Id_RouteType] UNIQUE ([Id], [RouteType]),
    CONSTRAINT [CK_ChatIntent_RouteType] CHECK ([RouteType] IN ('CHAT_KB','RAG','DATA','ACTION','REPORT','CLARIFICATION','MULTI_STEP')),
    CONSTRAINT [CK_ChatIntent_RiskLevel] CHECK ([RiskLevel] IS NULL OR [RiskLevel] IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    CONSTRAINT [FK_ChatIntent_McpToolSecurity] FOREIGN KEY ([McpToolSecurityId]) REFERENCES [AI].[McpToolSecurity] ([Id])
    ON DELETE SET NULL
    ON UPDATE CASCADE
);
GO

/****** Object: Table [AI].[chatKnowledgebase] ******/
CREATE TABLE [AI].[chatKnowledgebase](
    [Id]                      INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [KeyWords]                NVARCHAR(1000) NOT NULL,
    [Suggessions]             NVARCHAR(300) NOT NULL,
    [ResponseMsg]             NVARCHAR(4000) NOT NULL,
    [ResponseFilter]          NVARCHAR(100) NULL,
    [NextCKBID]               INT NULL,
    [ChatIntentId]            INT NULL,    -- FK to AI.ChatIntent
    [ConfidenceThreshold]     DECIMAL(3,2) NULL,
    [Priority]                INT NOT NULL CONSTRAINT [DF_chatKnowledgebase_Priority] DEFAULT (0),
    [MatchType]               VARCHAR(20) NOT NULL CONSTRAINT [DF_chatKnowledgebase_MatchType] DEFAULT ('KEYWORD'),
    [IsActive]                BIT NOT NULL CONSTRAINT [DF_chatKnowledgebase_IsActive] DEFAULT (1),
    [CreatedBy]               INT NULL,
    [CreatedDate]             DATETIME NOT NULL CONSTRAINT [DF_chatKnowledgebase_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]               INT NULL,
    [UpdatedDate]             DATETIME NULL,
    [MarkedForDeletion]       BIT NOT NULL CONSTRAINT [DF_chatKnowledgebase_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]   DATETIME NULL,
    CONSTRAINT [PK_chatKnowledgebase] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [CK_chatKnowledgebase_NextNotSelf] CHECK ([NextCKBID] IS NULL OR [NextCKBID] <> [Id]),
    CONSTRAINT [FK_chatKnowledgebase_NextCKBID] FOREIGN KEY ([NextCKBID]) REFERENCES [AI].[chatKnowledgebase] ([Id]),
    CONSTRAINT [FK_chatKnowledgebase_ChatIntent] FOREIGN KEY ([ChatIntentId]) REFERENCES [AI].[ChatIntent] ([Id]),
    CONSTRAINT [CK_chatKnowledgebase_ConfidenceThreshold] CHECK ([ConfidenceThreshold] IS NULL OR [ConfidenceThreshold] BETWEEN 0 AND 1),
    CONSTRAINT [CK_chatKnowledgebase_MatchType] CHECK ([MatchType] IN ('EXACT','KEYWORD','PREFIX','REGEX','SEMANTIC'))
);
GO

CREATE NONCLUSTERED INDEX [IX_chatKnowledgebase_NextCKBID]
ON [AI].[chatKnowledgebase] ([NextCKBID] ASC);
GO

-- New index for intent-based lookups
CREATE NONCLUSTERED INDEX [IX_chatKnowledgebase_ChatIntentId]
ON [AI].[chatKnowledgebase] ([ChatIntentId] ASC);
GO

CREATE OR ALTER TRIGGER [AI].[TR_chatKnowledgebase_PreventCycles]
ON [AI].[chatKnowledgebase]
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT UPDATE(NextCKBID)
        RETURN;

    DECLARE @HasCycle BIT = 0;

    ;WITH KnowledgeChain AS
    (
        SELECT
            I.[Id],
            I.NextCKBID,
            CAST('|' + CAST(I.[Id] AS VARCHAR(11)) + '|' AS VARCHAR(MAX)) AS VisitedPath,
            CAST(0 AS BIT) AS HasCycle
        FROM inserted I
        WHERE I.NextCKBID IS NOT NULL

        UNION ALL

        SELECT
            K.[Id],
            K2.NextCKBID,
            CAST(K.VisitedPath + CAST(K2.[Id] AS VARCHAR(11)) + '|' AS VARCHAR(MAX)),
            CAST(CASE
                WHEN CHARINDEX('|' + CAST(K2.[Id] AS VARCHAR(11)) + '|', K.VisitedPath) > 0
                THEN 1 ELSE 0
            END AS BIT)
        FROM KnowledgeChain K
        INNER JOIN [AI].[chatKnowledgebase] K2 WITH (UPDLOCK, HOLDLOCK)
            ON K.NextCKBID = K2.[Id]
        WHERE K.HasCycle = 0
    )
    SELECT TOP (1) @HasCycle = 1
    FROM KnowledgeChain
    WHERE HasCycle = 1
    OPTION (MAXRECURSION 0);

    IF @HasCycle = 1
        THROW 51002, 'Circular knowledge-base chain detected.', 1;
END;
GO

/****** Object:  Table [AI].[ModelConfiguration] ******/
CREATE TABLE [AI].[ModelConfiguration](
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ModelType]             VARCHAR(20) NOT NULL,
    [ModelName]             NVARCHAR(100) NOT NULL,
    [Provider]              VARCHAR(50) NOT NULL CONSTRAINT [DF_ModelConfiguration_Provider] DEFAULT ('OLLAMA'),
    [EndpointUrl]           NVARCHAR(500) NULL,
    [ApiKeySecretRef]       NVARCHAR(200) NULL,   -- Secret NAME/identifier only (e.g. 'kv:ai-openai-key'); the actual API key must never be stored here
    [ContextWindowTokens]   INT NULL,
    [MaxOutputTokens]       INT NULL,
    [EmbeddingDimension]    INT NULL,
    [Temperature]           DECIMAL(3,2) NULL,
    [TopP]                  DECIMAL(3,2) NULL,
    [IsDefault]             BIT NOT NULL CONSTRAINT [DF_ModelConfiguration_IsDefault] DEFAULT (0),
    [Parameters]            NVARCHAR(2000) NULL,
    [IsActive]              BIT NOT NULL CONSTRAINT [DF_ModelConfiguration_IsActive] DEFAULT (1),
    [CreatedBy]             INT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_ModelConfiguration_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT NULL,
    [UpdatedDate]           DATETIME NULL,
    [MarkedForDeletion]         BIT NOT NULL CONSTRAINT [DF_ModelConfiguration_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]     DATETIME NULL,
    CONSTRAINT [PK_ModelConfiguration] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_ModelConfiguration_ModelName_Provider_ModelType] UNIQUE ([ModelName], [Provider], [ModelType]),
    -- Target for VectorCollection's composite FK (model type + dimension must match).
    CONSTRAINT [UQ_ModelConfiguration_Id_ModelType_EmbeddingDimension] UNIQUE ([Id], [ModelType], [EmbeddingDimension]),
    CONSTRAINT [CK_ModelConfiguration_ModelType] CHECK ([ModelType] IN ('CHAT','EMBEDDING','ROUTER')),
    CONSTRAINT [CK_ModelConfiguration_Provider] CHECK ([Provider] IN ('OLLAMA','OPENAI','AZURE_OPENAI','ANTHROPIC','GEMINI','OTHER')),
    -- Guardrail, not proof: identifier characters only, and rejects values that look like raw provider keys.
    CONSTRAINT [CK_ModelConfiguration_ApiKeySecretRef] CHECK ([ApiKeySecretRef] IS NULL OR (
        [ApiKeySecretRef] NOT LIKE '%[^A-Za-z0-9._:/-]%'
        AND [ApiKeySecretRef] NOT LIKE 'sk-%'
        AND [ApiKeySecretRef] NOT LIKE 'AIza%'
        AND [ApiKeySecretRef] NOT LIKE 'xai-%'
        AND LEN([ApiKeySecretRef]) <= 100)),
    CONSTRAINT [CK_ModelConfiguration_Parameters_IsJson] CHECK ([Parameters] IS NULL OR ISJSON([Parameters]) = 1),
    -- EMBEDDING models must declare their vector size and carry no text-generation settings.
    CONSTRAINT [CK_ModelConfiguration_Embedding_Dimension_Required] CHECK ([ModelType] <> 'EMBEDDING' OR [EmbeddingDimension] IS NOT NULL),
    CONSTRAINT [CK_ModelConfiguration_Embedding_NoGenerationSettings] CHECK ([ModelType] <> 'EMBEDDING' OR ([MaxOutputTokens] IS NULL AND [Temperature] IS NULL AND [TopP] IS NULL)),
    -- CHAT / ROUTER models are generative: no embedding dimension.
    CONSTRAINT [CK_ModelConfiguration_Generative_NoEmbeddingDimension] CHECK ([ModelType] = 'EMBEDDING' OR [EmbeddingDimension] IS NULL),
    CONSTRAINT [CK_ModelConfiguration_MaxOutputWithinContext] CHECK ([MaxOutputTokens] IS NULL OR [ContextWindowTokens] IS NULL OR [MaxOutputTokens] <= [ContextWindowTokens]),
    CONSTRAINT [CK_ModelConfiguration_ContextWindowTokens] CHECK ([ContextWindowTokens] IS NULL OR [ContextWindowTokens] > 0),
    CONSTRAINT [CK_ModelConfiguration_MaxOutputTokens] CHECK ([MaxOutputTokens] IS NULL OR [MaxOutputTokens] > 0),
    CONSTRAINT [CK_ModelConfiguration_EmbeddingDimension] CHECK ([EmbeddingDimension] IS NULL OR [EmbeddingDimension] > 0),
    CONSTRAINT [CK_ModelConfiguration_Temperature] CHECK ([Temperature] IS NULL OR [Temperature] BETWEEN 0 AND 2),
    CONSTRAINT [CK_ModelConfiguration_TopP] CHECK ([TopP] IS NULL OR [TopP] BETWEEN 0 AND 1)
);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UQ_ModelConfiguration_OneDefaultPerType] ON [AI].[ModelConfiguration] ([ModelType]) WHERE [IsDefault] = 1 AND [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO

/****** Object:  Table [AI].[PromptTemplate] ******/
CREATE TABLE [AI].[PromptTemplate](
    [Id]                INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [TemplateCode]      VARCHAR(50) NOT NULL,
    [TemplateName]      NVARCHAR(150) NOT NULL,
    [Category]          VARCHAR(50) NULL,
    [TemplateContent]   NVARCHAR(4000) NOT NULL,
    [Version]           INT NOT NULL CONSTRAINT [DF_PromptTemplate_Version] DEFAULT (1),
    [Language]          VARCHAR(10) NULL,
    [IsDefault]         BIT NOT NULL CONSTRAINT [DF_PromptTemplate_IsDefault] DEFAULT (0),
    [IsActive]          BIT NOT NULL CONSTRAINT [DF_PromptTemplate_IsActive] DEFAULT (1),
    [CreatedBy]         INT NULL,
    [CreatedDate]       DATETIME NOT NULL CONSTRAINT [DF_PromptTemplate_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]         INT NULL,
    [UpdatedDate]       DATETIME NULL,
    [MarkedForDeletion]     BIT NOT NULL CONSTRAINT [DF_PromptTemplate_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    CONSTRAINT [PK_PromptTemplate] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_PromptTemplate_TemplateCode_Version] UNIQUE ([TemplateCode], [Version]),
    CONSTRAINT [CK_PromptTemplate_Version] CHECK ([Version] > 0)
);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UQ_PromptTemplate_OneDefaultPerCategory] ON [AI].[PromptTemplate] ([Category]) WHERE [IsDefault] = 1 AND [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO
-- Template history: many versions per TemplateCode, but only one live version at a time.
CREATE UNIQUE NONCLUSTERED INDEX [UQ_PromptTemplate_OneActivePerTemplateCode] ON [AI].[PromptTemplate] ([TemplateCode]) WHERE [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO

/****** Object:  Table [AI].[WidgetKey] ******/
CREATE TABLE [AI].[WidgetKey](
    [Id]                INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [WidgetKeyValue]    UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_WidgetKey_WidgetKeyValue] DEFAULT (NEWID()),
    [SiteName]          NVARCHAR(150) NOT NULL,
    [Description]       NVARCHAR(500) NULL,
    [IsActive]          BIT NOT NULL CONSTRAINT [DF_WidgetKey_IsActive] DEFAULT (1),
    -- Lifecycle / rotation / revocation.
    -- Rotation: insert a new key row, set the old row's ReplacedByWidgetKeyId to it and give the old row an
    --           ExpiresAt (grace period so deployed widgets can switch over). Never reuse or edit WidgetKeyValue.
    -- Revocation: set RevokedAt/RevokedBy/RevokedReason and IsActive = 0. Revocation is permanent; issue a new key instead.
    -- A key is usable only when IsActive = 1 AND RevokedAt IS NULL AND (ExpiresAt IS NULL OR ExpiresAt > now).
    [ExpiresAt]             DATETIME NULL,          -- Hard expiry; NULL = no expiry
    [LastUsedAt]            DATETIME NULL,          -- Last successful validation, for spotting stale/leaked keys
    [ReplacedByWidgetKeyId] INT NULL,               -- Successor key when this one was rotated
    [RevokedAt]             DATETIME NULL,
    [RevokedBy]             INT NULL,
    [RevokedReason]         NVARCHAR(200) NULL,
    [CreatedBy]         INT NULL,
    [CreatedDate]       DATETIME NOT NULL CONSTRAINT [DF_WidgetKey_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]         INT NULL,
    [UpdatedDate]       DATETIME NULL,
    [MarkedForDeletion]     BIT NOT NULL CONSTRAINT [DF_WidgetKey_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    CONSTRAINT [PK_WidgetKey] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_WidgetKey_WidgetKeyValue] UNIQUE ([WidgetKeyValue]),
    CONSTRAINT [FK_WidgetKey_ReplacedByWidgetKey] FOREIGN KEY ([ReplacedByWidgetKeyId]) REFERENCES [AI].[WidgetKey] ([Id]),
    CONSTRAINT [CK_WidgetKey_NotReplacedBySelf] CHECK ([ReplacedByWidgetKeyId] IS NULL OR [ReplacedByWidgetKeyId] <> [Id]),
    CONSTRAINT [CK_WidgetKey_ExpiresAfterCreated] CHECK ([ExpiresAt] IS NULL OR [ExpiresAt] > [CreatedDate]),
    -- A revoked key cannot stay active, and revocation details travel together.
    CONSTRAINT [CK_WidgetKey_RevokedIsInactive] CHECK ([RevokedAt] IS NULL OR [IsActive] = 0),
    CONSTRAINT [CK_WidgetKey_RevocationDetails] CHECK (([RevokedAt] IS NOT NULL AND [RevokedBy] IS NOT NULL) OR ([RevokedAt] IS NULL AND [RevokedBy] IS NULL AND [RevokedReason] IS NULL))
);
GO
CREATE NONCLUSTERED INDEX [IX_WidgetKey_ReplacedByWidgetKeyId] ON [AI].[WidgetKey] ([ReplacedByWidgetKeyId] ASC) WHERE [ReplacedByWidgetKeyId] IS NOT NULL;
GO
CREATE NONCLUSTERED INDEX [IX_WidgetKey_ExpiresAt] ON [AI].[WidgetKey] ([ExpiresAt] ASC) WHERE [ExpiresAt] IS NOT NULL AND [IsActive] = 1;
GO

/****** Object:  Table [AI].[WidgetAllowedOrigin] ******/
CREATE TABLE [AI].[WidgetAllowedOrigin](
    [Id]            INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [WidgetKeyId]   INT NOT NULL,
    [Origin]        NVARCHAR(255) NOT NULL,
    [IsActive]      BIT NOT NULL CONSTRAINT [DF_WidgetAllowedOrigin_IsActive] DEFAULT (1),
    [CreatedBy]     INT NULL,
    [CreatedDate]   DATETIME NOT NULL CONSTRAINT [DF_WidgetAllowedOrigin_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]     INT NULL,
    [UpdatedDate]   DATETIME NULL,

    CONSTRAINT [PK_WidgetAllowedOrigin] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_WidgetAllowedOrigin_WidgetKey] FOREIGN KEY ([WidgetKeyId]) REFERENCES [AI].[WidgetKey] ([Id]),
    CONSTRAINT [UQ_WidgetAllowedOrigin_WidgetKeyId_Origin] UNIQUE ([WidgetKeyId], [Origin])
);
GO
CREATE NONCLUSTERED INDEX [IX_WidgetAllowedOrigin_Origin] ON [AI].[WidgetAllowedOrigin] ([Origin] ASC) WHERE [IsActive] = 1;
GO

/****** Object:  Table [AI].[AuditLog] ******/
CREATE TABLE [AI].[AuditLog](
    [Id]            INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ActionType]    VARCHAR(50) NOT NULL,
    [EntityType]    NVARCHAR(100) NULL,
    [EntityId]      INT NULL,
    [ActorType]     VARCHAR(10) NOT NULL,
    -- Actor identity is split into typed, FK-backed columns instead of a polymorphic ActorId:
    --   CITIZEN -> ActorCitizenId (CORE.CitizenMaster); NULL = anonymous (unauthenticated) citizen
    --   STAFF   -> ActorUserId    (CORE.UserMaster);    required
    --   SYSTEM  -> both NULL
    [ActorCitizenId] INT NULL,
    [ActorUserId]   INT NULL,
    [ActorName]     NVARCHAR(150) NULL,
    [Description]   NVARCHAR(1000) NULL,
    [IpAddress]     NVARCHAR(45) NULL,
    [UserAgent]     NVARCHAR(500) NULL,
    [IsActive]      BIT NOT NULL CONSTRAINT [DF_AuditLog_IsActive] DEFAULT (1),
    [CreatedBy]     INT NULL,
    [CreatedDate]   DATETIME NOT NULL CONSTRAINT [DF_AuditLog_CreatedDate] DEFAULT (GETDATE()),

    CONSTRAINT [PK_AuditLog] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_AuditLog_ActorCitizen] FOREIGN KEY ([ActorCitizenId]) REFERENCES [CORE].[CitizenMaster] ([Id]),
    CONSTRAINT [FK_AuditLog_ActorUser] FOREIGN KEY ([ActorUserId]) REFERENCES [CORE].[UserMaster] ([Id]),
    CONSTRAINT [CK_AuditLog_ActorType] CHECK ([ActorType] IN ('CITIZEN','STAFF','SYSTEM')),
    CONSTRAINT [CK_AuditLog_ActorIdentity] CHECK (
        ([ActorType] = 'CITIZEN' AND [ActorUserId] IS NULL)
        OR ([ActorType] = 'STAFF' AND [ActorUserId] IS NOT NULL AND [ActorCitizenId] IS NULL)
        OR ([ActorType] = 'SYSTEM' AND [ActorUserId] IS NULL AND [ActorCitizenId] IS NULL))
);
GO
CREATE NONCLUSTERED INDEX [IX_AuditLog_EntityType_EntityId] ON [AI].[AuditLog] ([EntityType] ASC, [EntityId] ASC);
GO
CREATE NONCLUSTERED INDEX [IX_AuditLog_CreatedDate] ON [AI].[AuditLog] ([CreatedDate] ASC);
GO
CREATE NONCLUSTERED INDEX [IX_AuditLog_ActorCitizenId] ON [AI].[AuditLog] ([ActorCitizenId] ASC) WHERE [ActorCitizenId] IS NOT NULL;
GO
CREATE NONCLUSTERED INDEX [IX_AuditLog_ActorUserId] ON [AI].[AuditLog] ([ActorUserId] ASC) WHERE [ActorUserId] IS NOT NULL;
GO

/* AuditLog is append-only: rows may be inserted but never changed or removed.
   INSTEAD OF triggers reject UPDATE/DELETE for every caller, including soft-delete style updates.
   Any retention/archival purge must be a deliberate, privileged operation (disable the trigger, purge, re-enable). */
CREATE OR ALTER TRIGGER [AI].[TR_AuditLog_PreventUpdate] ON [AI].[AuditLog]
INSTEAD OF UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    THROW 51003, 'AI.AuditLog is append-only; UPDATE is not allowed.', 1;
END;
GO
CREATE OR ALTER TRIGGER [AI].[TR_AuditLog_PreventDelete] ON [AI].[AuditLog]
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    THROW 51004, 'AI.AuditLog is append-only; DELETE is not allowed.', 1;
END;
GO

/****** Object:  Table [AI].[RefreshToken] ******/
CREATE TABLE [AI].[RefreshToken](
    [Id]            INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [TokenHash]     VARCHAR(64) NOT NULL,   -- SHA-256 hex digest of the refresh token; the raw token is never stored (hash the presented token and look it up here)
    [CitizenId]     INT NOT NULL,
    [ExpiresAt]     DATETIME NOT NULL,
    [IsRevoked]     BIT NOT NULL CONSTRAINT [DF_RefreshToken_IsRevoked] DEFAULT (0),
    [RevokedAt]     DATETIME NULL,
    [IpAddress]     NVARCHAR(45) NULL,
    [UserAgent]     NVARCHAR(500) NULL,
    [IsActive]      BIT NOT NULL CONSTRAINT [DF_RefreshToken_IsActive] DEFAULT (1),
    [CreatedBy]     INT NULL,
    [CreatedDate]   DATETIME NOT NULL CONSTRAINT [DF_RefreshToken_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]     INT NULL,
    [UpdatedDate]   DATETIME NULL,
    [MarkedForDeletion]     BIT NOT NULL CONSTRAINT [DF_RefreshToken_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    CONSTRAINT [PK_RefreshToken] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_RefreshToken_TokenHash] UNIQUE ([TokenHash]),
    CONSTRAINT [CK_RefreshToken_TokenHash_Sha256Hex] CHECK (LEN([TokenHash]) = 64 AND [TokenHash] NOT LIKE '%[^0-9a-fA-F]%'),
    CONSTRAINT [CK_RefreshToken_RevokedAt_Consistent] CHECK (([IsRevoked] = 1 AND [RevokedAt] IS NOT NULL) OR ([IsRevoked] = 0 AND [RevokedAt] IS NULL)),
    CONSTRAINT [FK_RefreshToken_Citizen] FOREIGN KEY ([CitizenId]) REFERENCES [CORE].[CitizenMaster] ([Id]) ON DELETE CASCADE
);
GO
CREATE NONCLUSTERED INDEX [IX_RefreshToken_CitizenId] ON [AI].[RefreshToken] ([CitizenId] ASC);
GO

/****** Object:  Table [AI].[LoginHistory] ******/
CREATE TABLE [AI].[LoginHistory](
    [Id]            INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [CitizenId]     INT NULL,
    [UserId]        INT NULL,
    [ActorRole]     VARCHAR(20) NOT NULL,
    [LoginMethod]   VARCHAR(20) NOT NULL,
    [LoginStatus]   VARCHAR(20) NOT NULL,
    [FailureReason] NVARCHAR(200) NULL,
    [IpAddress]     NVARCHAR(45) NULL,
    [UserAgent]     NVARCHAR(500) NULL,
    [LoginAt]       DATETIME NOT NULL CONSTRAINT [DF_LoginHistory_LoginAt] DEFAULT (GETDATE()),
    [LogoutAt]      DATETIME NULL,
    [IsActive]      BIT NOT NULL CONSTRAINT [DF_LoginHistory_IsActive] DEFAULT (1),
    [CreatedBy]     INT NULL,
    [CreatedDate]   DATETIME NOT NULL CONSTRAINT [DF_LoginHistory_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]     INT NULL,
    [UpdatedDate]   DATETIME NULL,
    [MarkedForDeletion]     BIT NOT NULL CONSTRAINT [DF_LoginHistory_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    CONSTRAINT [PK_LoginHistory] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_LoginHistory_Citizen] FOREIGN KEY ([CitizenId]) REFERENCES [CORE].[CitizenMaster] ([Id]),
    CONSTRAINT [FK_LoginHistory_UserMaster] FOREIGN KEY ([UserId]) REFERENCES [CORE].[UserMaster] ([Id]),
    CONSTRAINT [CK_LoginHistory_ActorRole] CHECK ([ActorRole] IN ('CITIZEN','ADMIN','HELP_DESK')),
    CONSTRAINT [CK_LoginHistory_LoginMethod] CHECK ([LoginMethod] IN ('OTP','MPIN','PASSWORD','CFC_ASSISTED')),
    CONSTRAINT [CK_LoginHistory_LoginStatus] CHECK ([LoginStatus] IN ('SUCCESS','FAILED','LOCKED')),
    CONSTRAINT [CK_LoginHistory_LogoutAfterLogin] CHECK ([LogoutAt] IS NULL OR [LogoutAt] >= [LoginAt]),
    CONSTRAINT [CK_LoginHistory_ExactlyOneActor] CHECK (([CitizenId] IS NOT NULL AND [UserId] IS NULL) OR ([CitizenId] IS NULL AND [UserId] IS NOT NULL)),
    -- ActorRole must match the populated actor column: CITIZEN -> CitizenId; ADMIN/HELP_DESK -> UserId.
    CONSTRAINT [CK_LoginHistory_ActorRole_MatchesActor] CHECK (
        ([ActorRole] = 'CITIZEN' AND [CitizenId] IS NOT NULL AND [UserId] IS NULL)
        OR ([ActorRole] IN ('ADMIN','HELP_DESK') AND [UserId] IS NOT NULL AND [CitizenId] IS NULL))
);
GO
CREATE NONCLUSTERED INDEX [IX_LoginHistory_CitizenId] ON [AI].[LoginHistory] ([CitizenId] ASC) WHERE [CitizenId] IS NOT NULL;
GO
CREATE NONCLUSTERED INDEX [IX_LoginHistory_UserId] ON [AI].[LoginHistory] ([UserId] ASC) WHERE [UserId] IS NOT NULL;
GO
CREATE NONCLUSTERED INDEX [IX_LoginHistory_LoginAt] ON [AI].[LoginHistory] ([LoginAt] ASC);
GO

/****** Object:  Table [AI].[ChatSession] ******/
CREATE TABLE [AI].[ChatSession](
    [Id]                        INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [SessionGuid]               UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_ChatSession_SessionGuid] DEFAULT (NEWSEQUENTIALID()),
    [CitizenId]                 INT NULL,
    [AssignedHelpDeskUserId]    INT NULL,
    [ChannelCode]               VARCHAR(30) NOT NULL CONSTRAINT [DF_ChatSession_ChannelCode] DEFAULT ('WEB_WIDGET'),
    [Status]                    VARCHAR(20) NOT NULL CONSTRAINT [DF_ChatSession_Status] DEFAULT ('OPEN'),
    [StartedAt]                 DATETIME NOT NULL CONSTRAINT [DF_ChatSession_StartedAt] DEFAULT (GETDATE()),
    [LastActivityAt]            DATETIME NOT NULL CONSTRAINT [DF_ChatSession_LastActivityAt] DEFAULT (GETDATE()),
    [ClosedAt]                  DATETIME NULL,
    [ClosedReason]              NVARCHAR(200) NULL,
    [IpAddress]                 NVARCHAR(45) NULL,
    [UserAgent]                 NVARCHAR(500) NULL,
    [Language]                  VARCHAR(10) NULL,
    [Latitude]                  DECIMAL(9,6) NULL,
    [Longitude]                 DECIMAL(10,6) NULL,
    [Title]                     NVARCHAR(200) NULL,
    [IsPinned]                  BIT NOT NULL CONSTRAINT [DF_ChatSession_IsPinned] DEFAULT (0),
    [LastChatIntentId]          INT NULL,   -- FK to AI.ChatIntent; intent code/name are read through the join, not copied here
    [LastRouteType]             VARCHAR(20) NULL,
    [LastEntitiesJson]          NVARCHAR(4000) NULL,
    [HandoffStatus]             VARCHAR(20) NULL CONSTRAINT [CK_ChatSession_HandoffStatus] CHECK ([HandoffStatus] IN ('REQUESTED','ACCEPTED','DECLINED')),
    [IsActive]                  BIT NOT NULL CONSTRAINT [DF_ChatSession_IsActive] DEFAULT (1),
    [CreatedBy]                 INT NULL,
    [CreatedDate]               DATETIME NOT NULL CONSTRAINT [DF_ChatSession_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]                 INT NULL,
    [UpdatedDate]                DATETIME NULL,
    [MarkedForDeletion]          BIT NOT NULL CONSTRAINT [DF_ChatSession_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]      DATETIME NULL,
    CONSTRAINT [PK_ChatSession] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_ChatSession_SessionGuid] UNIQUE ([SessionGuid]),
    -- Target for composite FKs that must prove a citizen owns a session (e.g. ChatFeedback).
    CONSTRAINT [UQ_ChatSession_Id_CitizenId] UNIQUE ([Id], [CitizenId]),
    CONSTRAINT [FK_ChatSession_Citizen] FOREIGN KEY ([CitizenId]) REFERENCES [CORE].[CitizenMaster] ([Id]),
    CONSTRAINT [FK_ChatSession_UserMaster] FOREIGN KEY ([AssignedHelpDeskUserId]) REFERENCES [CORE].[UserMaster] ([Id]),
    CONSTRAINT [CK_ChatSession_ChannelCode] CHECK ([ChannelCode] IN ('WEB_WIDGET','WHATSAPP','MOBILE_APP','IVR','EMBEDDED_WIDGET')),
    CONSTRAINT [CK_ChatSession_Status] CHECK ([Status] IN ('OPEN','ASSIGNED','ESCALATED','RESOLVED','CLOSED','ABANDONED')),
    CONSTRAINT [CK_ChatSession_ClosedAfterStart] CHECK ([ClosedAt] IS NULL OR [ClosedAt] >= [StartedAt]),
    CONSTRAINT [FK_ChatSession_LastChatIntent] FOREIGN KEY ([LastChatIntentId]) REFERENCES [AI].[ChatIntent] ([Id]),
    CONSTRAINT [CK_ChatSession_LastRouteType] CHECK ([LastRouteType] IS NULL OR [LastRouteType] IN ('CHAT_KB','RAG','DATA','ACTION','REPORT','CLARIFICATION','MULTI_STEP')),
    CONSTRAINT [CK_ChatSession_LastEntitiesJson_IsJson] CHECK ([LastEntitiesJson] IS NULL OR ISJSON([LastEntitiesJson]) = 1),
    CONSTRAINT [CK_ChatSession_Latitude] CHECK ([Latitude] IS NULL OR [Latitude] BETWEEN -90 AND 90),
    CONSTRAINT [CK_ChatSession_Longitude] CHECK ([Longitude] IS NULL OR [Longitude] BETWEEN -180 AND 180),
    CONSTRAINT [CK_ChatSession_LatLong_Pair] CHECK (([Latitude] IS NULL AND [Longitude] IS NULL) OR ([Latitude] IS NOT NULL AND [Longitude] IS NOT NULL))
);
GO
CREATE NONCLUSTERED INDEX [IX_ChatSession_CitizenId] ON [AI].[ChatSession] ([CitizenId] ASC) WHERE [CitizenId] IS NOT NULL;
GO
CREATE NONCLUSTERED INDEX [IX_ChatSession_LastChatIntentId] ON [AI].[ChatSession] ([LastChatIntentId] ASC) WHERE [LastChatIntentId] IS NOT NULL;
GO
CREATE NONCLUSTERED INDEX [IX_ChatSession_AssignedHelpDeskUserId] ON [AI].[ChatSession] ([AssignedHelpDeskUserId] ASC) WHERE [AssignedHelpDeskUserId] IS NOT NULL;
GO
CREATE NONCLUSTERED INDEX [IX_ChatSession_Status_LastActivityAt] ON [AI].[ChatSession] ([Status] ASC, [LastActivityAt] ASC);
GO

/****** Object:  Table [AI].[Document] ******/
CREATE TABLE [AI].[Document](
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [CategoryId]            INT NULL,
    [Title]                 NVARCHAR(300) NOT NULL,
    [DocumentType]          VARCHAR(30) NOT NULL,
    [SourceReferenceNo]     NVARCHAR(100) NULL,
    [OriginalFileName]      NVARCHAR(500) NULL,
    [FileExtension]         VARCHAR(20) NULL,
    [MimeType]              VARCHAR(200) NULL,
    [FileSizeBytes]         BIGINT NULL,
    [StorageProvider]       VARCHAR(50) NOT NULL CONSTRAINT [DF_Document_StorageProvider] DEFAULT ('FOLDER'),
    [StoragePath]           NVARCHAR(1000) NULL,
    [ChecksumSha256]        VARCHAR(64) NULL,
    [ContentText]           NVARCHAR(MAX) NULL,   -- Intentionally MAX: full text extracted from the uploaded file (GR/circular/manual), unbounded; it is chunked into DocumentChunk and never indexed or filtered on directly
    [Language]              VARCHAR(10) NULL,
    [Version]               INT NOT NULL CONSTRAINT [DF_Document_Version] DEFAULT (1),
    [ProcessingStatus]      VARCHAR(20) NOT NULL CONSTRAINT [DF_Document_ProcessingStatus] DEFAULT ('PENDING'),
    [EffectiveFrom]         DATE NULL,
    [EffectiveTo]           DATE NULL,
    [PublishedDate]         DATETIME NULL,
    [IsActive]              BIT NOT NULL CONSTRAINT [DF_Document_IsActive] DEFAULT (1),
    [CreatedBy]             INT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_Document_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT NULL,
    [UpdatedDate]           DATETIME NULL,
    [MarkedForDeletion]         BIT NOT NULL CONSTRAINT [DF_Document_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]     DATETIME NULL,
    CONSTRAINT [PK_Document] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_Document_QuestionCategory] FOREIGN KEY ([CategoryId]) REFERENCES [AI].[QuestionCategory] ([Id]),
    CONSTRAINT [CK_Document_DocumentType] CHECK ([DocumentType] IN ('FAQ','GR','CIRCULAR','POLICY','MANUAL','OTHER')),
    CONSTRAINT [CK_Document_StorageProvider] CHECK ([StorageProvider] IN ('FOLDER','AWS_S3','AZURE_BLOB')),
    CONSTRAINT [CK_Document_FileSizeBytes] CHECK ([FileSizeBytes] IS NULL OR [FileSizeBytes] >= 0),
    CONSTRAINT [CK_Document_ChecksumSha256_Length] CHECK ([ChecksumSha256] IS NULL OR LEN([ChecksumSha256]) = 64),
    CONSTRAINT [CK_Document_Version] CHECK ([Version] > 0),
    CONSTRAINT [CK_Document_ProcessingStatus] CHECK ([ProcessingStatus] IN ('PENDING','CHUNKING','EMBEDDING','COMPLETED','FAILED')),
    CONSTRAINT [CK_Document_EffectiveRange] CHECK ([EffectiveFrom] IS NULL OR [EffectiveTo] IS NULL OR [EffectiveTo] >= [EffectiveFrom])
);
GO
CREATE NONCLUSTERED INDEX [IX_Document_CategoryId] ON [AI].[Document] ([CategoryId] ASC) WHERE [CategoryId] IS NOT NULL;
GO
CREATE NONCLUSTERED INDEX [IX_Document_ProcessingStatus] ON [AI].[Document] ([ProcessingStatus] ASC);
GO
-- Business key: one row per (DocumentType, SourceReferenceNo, Version).
-- Filtered so documents without a reference number and rows flagged for deletion do not collide.
CREATE UNIQUE NONCLUSTERED INDEX [UX_Document_SourceReference_Version]
    ON [AI].[Document] ([DocumentType] ASC, [SourceReferenceNo] ASC, [Version] ASC)
    WHERE [SourceReferenceNo] IS NOT NULL AND [MarkedForDeletion] = 0;
GO

/****** Object:  Table [AI].[VectorCollection] ******/
CREATE TABLE [AI].[VectorCollection](
    [Id]                     INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [CollectionName]         VARCHAR(100) NOT NULL,
    [DisplayName]            NVARCHAR(150) NOT NULL,
    [ModelConfigurationId]   INT NOT NULL,
    [ModelType]              VARCHAR(20) NOT NULL CONSTRAINT [DF_VectorCollection_ModelType] DEFAULT ('EMBEDDING'),   -- Always 'EMBEDDING'; exists so the FK can enforce the model's type
    [VectorDimension]        INT NOT NULL,
    [DistanceMetric]         VARCHAR(20) NOT NULL CONSTRAINT [DF_VectorCollection_DistanceMetric] DEFAULT ('COSINE'),
    [Description]            NVARCHAR(500) NULL,
    [PointCount]             INT NOT NULL CONSTRAINT [DF_VectorCollection_PointCount] DEFAULT (0),
    [LastSyncedAt]           DATETIME NULL,
    [IsActive]               BIT NOT NULL CONSTRAINT [DF_VectorCollection_IsActive] DEFAULT (1),
    [CreatedBy]              INT NULL,
    [CreatedDate]            DATETIME NOT NULL CONSTRAINT [DF_VectorCollection_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]              INT NULL,
    [UpdatedDate]            DATETIME NULL,
    [MarkedForDeletion]          BIT NOT NULL CONSTRAINT [DF_VectorCollection_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]      DATETIME NULL,
    CONSTRAINT [PK_VectorCollection] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_VectorCollection_CollectionName] UNIQUE ([CollectionName]),
    -- Composite FK: the referenced model must be an EMBEDDING model (ModelType is pinned to 'EMBEDDING' below)
    -- and VectorDimension must equal its EmbeddingDimension.
    CONSTRAINT [FK_VectorCollection_ModelConfiguration] FOREIGN KEY ([ModelConfigurationId], [ModelType], [VectorDimension]) REFERENCES [AI].[ModelConfiguration] ([Id], [ModelType], [EmbeddingDimension]),
    CONSTRAINT [CK_VectorCollection_ModelType] CHECK ([ModelType] = 'EMBEDDING'),
    CONSTRAINT [CK_VectorCollection_VectorDimension] CHECK ([VectorDimension] > 0),
    CONSTRAINT [CK_VectorCollection_DistanceMetric] CHECK ([DistanceMetric] IN ('COSINE','EUCLIDEAN','DOT')),
    CONSTRAINT [CK_VectorCollection_PointCount] CHECK ([PointCount] >= 0)
);
GO
CREATE NONCLUSTERED INDEX [IX_VectorCollection_ModelConfigurationId] ON [AI].[VectorCollection] ([ModelConfigurationId] ASC);
GO

/****** Object:  Table [AI].[ChatMessage] ******/
CREATE TABLE [AI].[ChatMessage](
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ChatSessionId]         INT NOT NULL,
    [SenderType]            VARCHAR(20) NOT NULL,
    [SenderCitizenId]       INT NULL,
    [SenderUserId]          INT NULL,
    [MessageText]           NVARCHAR(MAX) NOT NULL,   -- Intentionally MAX: assistant replies can reach MaxOutputTokens (4096 tokens, roughly 12-16k characters), more than the 4000-character NVARCHAR limit
    [MessageSequence]       INT NOT NULL,
    [ModelConfigurationId]  INT NULL,
    [ModelUsed]             NVARCHAR(100) NULL,
    [PromptTemplateId]      INT NULL,
    [PromptTokens]          INT NULL,
    [CompletionTokens]      INT NULL,
    [TotalTokens]           INT NULL,
    [ResponseTimeMs]        INT NULL,
    [StructuredContentJson] NVARCHAR(MAX) NULL,   -- Intentionally MAX: structured UI payload (tables/lists from data and report tools, e.g. a long payment history); size scales with result rows, so no safe fixed cap
    [PendingConfirmationJson] NVARCHAR(4000) NULL,
    [IsFlagged]             BIT NOT NULL CONSTRAINT [DF_ChatMessage_IsFlagged] DEFAULT (0),
    [IsActive]              BIT NOT NULL CONSTRAINT [DF_ChatMessage_IsActive] DEFAULT (1),
    [CreatedBy]             INT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_ChatMessage_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT NULL,
    [UpdatedDate]           DATETIME NULL,
    [MarkedForDeletion]         BIT NOT NULL CONSTRAINT [DF_ChatMessage_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]     DATETIME NULL,
    CONSTRAINT [PK_ChatMessage] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_ChatMessage_ChatSessionId_MessageSequence] UNIQUE ([ChatSessionId], [MessageSequence]),
    -- Target for composite FKs that must prove a message belongs to a given session (e.g. ChatFeedback).
    CONSTRAINT [UQ_ChatMessage_Id_ChatSessionId] UNIQUE ([Id], [ChatSessionId]),
    CONSTRAINT [FK_ChatMessage_ChatSession] FOREIGN KEY ([ChatSessionId]) REFERENCES [AI].[ChatSession] ([Id]),
    CONSTRAINT [FK_ChatMessage_Citizen] FOREIGN KEY ([SenderCitizenId]) REFERENCES [CORE].[CitizenMaster] ([Id]),
    CONSTRAINT [FK_ChatMessage_UserMaster] FOREIGN KEY ([SenderUserId]) REFERENCES [CORE].[UserMaster] ([Id]),
    CONSTRAINT [FK_ChatMessage_ModelConfiguration] FOREIGN KEY ([ModelConfigurationId]) REFERENCES [AI].[ModelConfiguration] ([Id]),
    CONSTRAINT [FK_ChatMessage_PromptTemplate] FOREIGN KEY ([PromptTemplateId]) REFERENCES [AI].[PromptTemplate] ([Id]),
    CONSTRAINT [CK_ChatMessage_SenderType] CHECK ([SenderType] IN ('CITIZEN','ASSISTANT','HELP_DESK','SYSTEM')),
    CONSTRAINT [CK_ChatMessage_PromptTokens] CHECK ([PromptTokens] IS NULL OR [PromptTokens] >= 0),
    CONSTRAINT [CK_ChatMessage_CompletionTokens] CHECK ([CompletionTokens] IS NULL OR [CompletionTokens] >= 0),
    CONSTRAINT [CK_ChatMessage_TotalTokens] CHECK ([TotalTokens] IS NULL OR [TotalTokens] >= 0),
    CONSTRAINT [CK_ChatMessage_ResponseTimeMs] CHECK ([ResponseTimeMs] IS NULL OR [ResponseTimeMs] >= 0),
    CONSTRAINT [CK_ChatMessage_StructuredContentJson_IsJson] CHECK ([StructuredContentJson] IS NULL OR ISJSON([StructuredContentJson]) = 1),
    CONSTRAINT [CK_ChatMessage_PendingConfirmationJson_IsJson] CHECK ([PendingConfirmationJson] IS NULL OR ISJSON([PendingConfirmationJson]) = 1),
    CONSTRAINT [CK_ChatMessage_SenderConsistency] CHECK (
        ([SenderType] = 'CITIZEN'   AND [SenderCitizenId] IS NOT NULL AND [SenderUserId] IS NULL) OR
        ([SenderType] = 'HELP_DESK' AND [SenderUserId]    IS NOT NULL AND [SenderCitizenId] IS NULL) OR
        ([SenderType] IN ('ASSISTANT','SYSTEM') AND [SenderCitizenId] IS NULL AND [SenderUserId] IS NULL)
    )
);
GO
CREATE NONCLUSTERED INDEX [IX_ChatMessage_ChatSessionId] ON [AI].[ChatMessage] ([ChatSessionId] ASC) INCLUDE ([MessageSequence], [SenderType], [CreatedDate]);
GO
CREATE NONCLUSTERED INDEX [IX_ChatMessage_SenderCitizenId] ON [AI].[ChatMessage] ([SenderCitizenId] ASC) WHERE [SenderCitizenId] IS NOT NULL;
GO
CREATE NONCLUSTERED INDEX [IX_ChatMessage_SenderUserId] ON [AI].[ChatMessage] ([SenderUserId] ASC) WHERE [SenderUserId] IS NOT NULL;
GO

/****** Object:  Table [AI].[ChatAssignment]  ******/
CREATE TABLE [AI].[ChatAssignment](
    [Id]                INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ChatSessionId]     INT NOT NULL,
    [HelpDeskUserId]    INT NOT NULL,
    [AssignedAt]        DATETIME NOT NULL CONSTRAINT [DF_ChatAssignment_AssignedAt] DEFAULT (GETDATE()),
    [UnassignedAt]      DATETIME NULL,
    [AssignmentStatus]  VARCHAR(20) NOT NULL CONSTRAINT [DF_ChatAssignment_AssignmentStatus] DEFAULT ('ACTIVE'),
    [IsActive]          BIT NOT NULL CONSTRAINT [DF_ChatAssignment_IsActive] DEFAULT (1),
    [CreatedBy]         INT NULL,
    [CreatedDate]       DATETIME NOT NULL CONSTRAINT [DF_ChatAssignment_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]         INT NULL,
    [UpdatedDate]       DATETIME NULL,
    [MarkedForDeletion]     BIT NOT NULL CONSTRAINT [DF_ChatAssignment_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    CONSTRAINT [PK_ChatAssignment] PRIMARY KEY CLUSTERED ([Id] ASC),
    -- Target for ChatTransfer's composite FK (assignment + session + assignee must agree).
    CONSTRAINT [UQ_ChatAssignment_Id_ChatSessionId_HelpDeskUserId] UNIQUE ([Id], [ChatSessionId], [HelpDeskUserId]),
    CONSTRAINT [FK_ChatAssignment_ChatSession] FOREIGN KEY ([ChatSessionId]) REFERENCES [AI].[ChatSession] ([Id]),
    CONSTRAINT [FK_ChatAssignment_UserMaster] FOREIGN KEY ([HelpDeskUserId]) REFERENCES [CORE].[UserMaster] ([Id]),
    CONSTRAINT [CK_ChatAssignment_AssignmentStatus] CHECK ([AssignmentStatus] IN ('ACTIVE','COMPLETED','TRANSFERRED')),
    CONSTRAINT [CK_ChatAssignment_UnassignedAfterAssigned] CHECK ([UnassignedAt] IS NULL OR [UnassignedAt] >= [AssignedAt]),
    CONSTRAINT [CK_ChatAssignment_UnassignedAt_Required] CHECK ([AssignmentStatus] NOT IN ('COMPLETED','TRANSFERRED') OR [UnassignedAt] IS NOT NULL)
);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UQ_ChatAssignment_OneActivePerSession] ON [AI].[ChatAssignment] ([ChatSessionId]) WHERE [AssignmentStatus] = 'ACTIVE' AND [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO
CREATE NONCLUSTERED INDEX [IX_ChatAssignment_HelpDeskUserId] ON [AI].[ChatAssignment] ([HelpDeskUserId] ASC);
GO

/****** Object:  Table [AI].[ChatTransfer] ******/
CREATE TABLE [AI].[ChatTransfer](
    [Id]                INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ChatSessionId]     INT NOT NULL,
    [FromAssignmentId]  INT NULL,       -- The assignment being handed over; NULL only when there was no previous assignee
    [FromUserId]        INT NULL,       -- Must be the HelpDeskUserId of FromAssignmentId on this same session (composite FK below)
    [ToUserId]          INT NOT NULL,
    [TransferReason]    NVARCHAR(500) NULL,
    [TransferredAt]     DATETIME NOT NULL CONSTRAINT [DF_ChatTransfer_TransferredAt] DEFAULT (GETDATE()),
    [IsActive]          BIT NOT NULL CONSTRAINT [DF_ChatTransfer_IsActive] DEFAULT (1),
    [CreatedBy]         INT NULL,
    [CreatedDate]       DATETIME NOT NULL CONSTRAINT [DF_ChatTransfer_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]         INT NULL,
    [UpdatedDate]       DATETIME NULL,
    [MarkedForDeletion]     BIT NOT NULL CONSTRAINT [DF_ChatTransfer_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    CONSTRAINT [PK_ChatTransfer] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_ChatTransfer_ChatSession] FOREIGN KEY ([ChatSessionId]) REFERENCES [AI].[ChatSession] ([Id]),
    CONSTRAINT [FK_ChatTransfer_FromUserMaster] FOREIGN KEY ([FromUserId]) REFERENCES [CORE].[UserMaster] ([Id]),
    CONSTRAINT [FK_ChatTransfer_ToUserMaster] FOREIGN KEY ([ToUserId]) REFERENCES [CORE].[UserMaster] ([Id]),
    CONSTRAINT [FK_ChatTransfer_FromAssignment] FOREIGN KEY ([FromAssignmentId], [ChatSessionId], [FromUserId]) REFERENCES [AI].[ChatAssignment] ([Id], [ChatSessionId], [HelpDeskUserId]),
    CONSTRAINT [CK_ChatTransfer_FromPair] CHECK (([FromAssignmentId] IS NULL AND [FromUserId] IS NULL) OR ([FromAssignmentId] IS NOT NULL AND [FromUserId] IS NOT NULL)),
    CONSTRAINT [CK_ChatTransfer_DifferentUsers] CHECK ([FromUserId] IS NULL OR [FromUserId] <> [ToUserId])
);
GO
CREATE NONCLUSTERED INDEX [IX_ChatTransfer_ChatSessionId] ON [AI].[ChatTransfer] ([ChatSessionId] ASC);
GO
CREATE NONCLUSTERED INDEX [IX_ChatTransfer_ToUserId] ON [AI].[ChatTransfer] ([ToUserId] ASC);
GO
CREATE NONCLUSTERED INDEX [IX_ChatTransfer_FromAssignmentId] ON [AI].[ChatTransfer] ([FromAssignmentId] ASC) WHERE [FromAssignmentId] IS NOT NULL;
GO

/****** Object:  Table [AI].[ChatNote] ******/
CREATE TABLE [AI].[ChatNote](
    [Id]                INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ChatSessionId]     INT NOT NULL,
    [AuthorUserId]      INT NOT NULL,
    [NoteText]          NVARCHAR(2000) NOT NULL,
    [IsInternal]        BIT NOT NULL CONSTRAINT [DF_ChatNote_IsInternal] DEFAULT (1),
    [IsActive]          BIT NOT NULL CONSTRAINT [DF_ChatNote_IsActive] DEFAULT (1),
    [CreatedBy]         INT NULL,
    [CreatedDate]       DATETIME NOT NULL CONSTRAINT [DF_ChatNote_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]         INT NULL,
    [UpdatedDate]       DATETIME NULL,
    [MarkedForDeletion]     BIT NOT NULL CONSTRAINT [DF_ChatNote_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    CONSTRAINT [PK_ChatNote] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_ChatNote_ChatSession] FOREIGN KEY ([ChatSessionId]) REFERENCES [AI].[ChatSession] ([Id]),
    CONSTRAINT [FK_ChatNote_UserMaster] FOREIGN KEY ([AuthorUserId]) REFERENCES [CORE].[UserMaster] ([Id])
);
GO
CREATE NONCLUSTERED INDEX [IX_ChatNote_ChatSessionId] ON [AI].[ChatNote] ([ChatSessionId] ASC);
GO

/****** Object:  Table [AI].[DocumentChunk] ******/
CREATE TABLE [AI].[DocumentChunk](
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [DocumentId]            INT NOT NULL,
    [VectorCollectionId]    INT NOT NULL,
    [ChunkSequence]         INT NOT NULL,
    [ChunkText]             NVARCHAR(4000) NOT NULL,   -- The chunker must cap chunks at 4000 characters (well inside typical embedding-model input limits)
    [ChunkTokenCount]       INT NULL,
    [QdrantPointId]         UNIQUEIDENTIFIER NULL,
    [EmbeddingStatus]       VARCHAR(20) NOT NULL CONSTRAINT [DF_DocumentChunk_EmbeddingStatus] DEFAULT ('PENDING'),
    [EmbeddedAt]            DATETIME NULL,
    [IsActive]              BIT NOT NULL CONSTRAINT [DF_DocumentChunk_IsActive] DEFAULT (1),
    [CreatedBy]             INT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_DocumentChunk_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT NULL,
    [UpdatedDate]           DATETIME NULL,
    [MarkedForDeletion]         BIT NOT NULL CONSTRAINT [DF_DocumentChunk_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]     DATETIME NULL,
    CONSTRAINT [PK_DocumentChunk] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_DocumentChunk_DocumentId_ChunkSequence] UNIQUE ([DocumentId], [ChunkSequence]),
    CONSTRAINT [FK_DocumentChunk_Document] FOREIGN KEY ([DocumentId]) REFERENCES [AI].[Document] ([Id]),
    CONSTRAINT [FK_DocumentChunk_VectorCollection] FOREIGN KEY ([VectorCollectionId]) REFERENCES [AI].[VectorCollection] ([Id]),
    CONSTRAINT [CK_DocumentChunk_ChunkSequence] CHECK ([ChunkSequence] > 0),
    CONSTRAINT [CK_DocumentChunk_EmbeddedAt_Required] CHECK ([EmbeddingStatus] <> 'EMBEDDED' OR [EmbeddedAt] IS NOT NULL),
    CONSTRAINT [CK_DocumentChunk_ChunkTokenCount] CHECK ([ChunkTokenCount] IS NULL OR [ChunkTokenCount] >= 0),
    CONSTRAINT [CK_DocumentChunk_EmbeddingStatus] CHECK ([EmbeddingStatus] IN ('PENDING','EMBEDDED','FAILED','STALE'))
);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UQ_DocumentChunk_QdrantPointId] ON [AI].[DocumentChunk] ([QdrantPointId]) WHERE [QdrantPointId] IS NOT NULL;
GO
CREATE NONCLUSTERED INDEX [IX_DocumentChunk_DocumentId] ON [AI].[DocumentChunk] ([DocumentId] ASC);
GO
CREATE NONCLUSTERED INDEX [IX_DocumentChunk_VectorCollectionId] ON [AI].[DocumentChunk] ([VectorCollectionId] ASC);
GO
CREATE NONCLUSTERED INDEX [IX_DocumentChunk_EmbeddingStatus] ON [AI].[DocumentChunk] ([EmbeddingStatus] ASC);
GO

/****** Object:  Table [AI].[ChatMessageChunk] ******/
-- Chunks retrieved to ground an assistant message (replaces the old delimited ChatMessage.RetrievedChunkIds text column).
CREATE TABLE [AI].[ChatMessageChunk](
    [Id]                INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ChatMessageId]     INT NOT NULL,
    [DocumentChunkId]   INT NOT NULL,
    [RetrievalRank]     INT NOT NULL,                   -- 1 = best match for this message
    [SimilarityScore]   DECIMAL(7,6) NULL,              -- Vector similarity at retrieval time, e.g. 0.873421
    [CreatedDate]       DATETIME NOT NULL CONSTRAINT [DF_ChatMessageChunk_CreatedDate] DEFAULT (GETDATE()),
    CONSTRAINT [PK_ChatMessageChunk] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_ChatMessageChunk_Message_Chunk] UNIQUE ([ChatMessageId], [DocumentChunkId]),
    CONSTRAINT [UQ_ChatMessageChunk_Message_Rank] UNIQUE ([ChatMessageId], [RetrievalRank]),
    CONSTRAINT [FK_ChatMessageChunk_ChatMessage] FOREIGN KEY ([ChatMessageId]) REFERENCES [AI].[ChatMessage] ([Id]),
    CONSTRAINT [FK_ChatMessageChunk_DocumentChunk] FOREIGN KEY ([DocumentChunkId]) REFERENCES [AI].[DocumentChunk] ([Id]),
    CONSTRAINT [CK_ChatMessageChunk_RetrievalRank] CHECK ([RetrievalRank] > 0)
);
GO
CREATE NONCLUSTERED INDEX [IX_ChatMessageChunk_DocumentChunkId] ON [AI].[ChatMessageChunk] ([DocumentChunkId] ASC);
GO

/****** Object:  Table [AI].[DocumentUploadHistory] ******/
CREATE TABLE [AI].[DocumentUploadHistory](
    [Id]                INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [DocumentId]        INT NOT NULL,
    [UploadAction]      VARCHAR(20) NOT NULL,
    [PreviousVersion]   INT NULL,
    [NewVersion]        INT NULL,
    [Notes]             NVARCHAR(1000) NULL,
    [ActionDate]        DATETIME NOT NULL CONSTRAINT [DF_DocumentUploadHistory_ActionDate] DEFAULT (GETDATE()),
    [IsActive]          BIT NOT NULL CONSTRAINT [DF_DocumentUploadHistory_IsActive] DEFAULT (1),
    [CreatedBy]         INT NULL,
    [CreatedDate]       DATETIME NOT NULL CONSTRAINT [DF_DocumentUploadHistory_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]         INT NULL,
    [UpdatedDate]       DATETIME NULL,
    [MarkedForDeletion]     BIT NOT NULL CONSTRAINT [DF_DocumentUploadHistory_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    CONSTRAINT [PK_DocumentUploadHistory] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_DocumentUploadHistory_Document] FOREIGN KEY ([DocumentId]) REFERENCES [AI].[Document] ([Id]),
    CONSTRAINT [CK_DocumentUploadHistory_UploadAction] CHECK ([UploadAction] IN ('CREATED','REUPLOADED','REPROCESSED','ARCHIVED','DELETED')),
    CONSTRAINT [CK_DocumentUploadHistory_VersionsPositive] CHECK (([PreviousVersion] IS NULL OR [PreviousVersion] > 0) AND ([NewVersion] IS NULL OR [NewVersion] > 0)),
    -- Version rules per action:
    --   CREATED     : NewVersion only (no previous version)
    --   REUPLOADED  : both versions, NewVersion strictly greater
    --   REPROCESSED : NewVersion only (the version that was reprocessed; the version does not change)
    --   ARCHIVED / DELETED : no PreviousVersion; NewVersion optional
    CONSTRAINT [CK_DocumentUploadHistory_VersionsByAction] CHECK (
        ([UploadAction] = 'CREATED'     AND [PreviousVersion] IS NULL     AND [NewVersion] IS NOT NULL) OR
        ([UploadAction] = 'REUPLOADED'  AND [PreviousVersion] IS NOT NULL AND [NewVersion] IS NOT NULL AND [NewVersion] > [PreviousVersion]) OR
        ([UploadAction] = 'REPROCESSED' AND [PreviousVersion] IS NULL     AND [NewVersion] IS NOT NULL) OR
        ([UploadAction] IN ('ARCHIVED','DELETED') AND [PreviousVersion] IS NULL)
    )
);
GO
CREATE NONCLUSTERED INDEX [IX_DocumentUploadHistory_DocumentId] ON [AI].[DocumentUploadHistory] ([DocumentId] ASC);
GO

/****** Object:  Table [AI].[ChatAnalytics] ******/
CREATE TABLE [AI].[ChatAnalytics](
    [Id]                        INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ChatSessionId]             INT NOT NULL,
    [QuestionCategoryId]        INT NULL,
    -- Message counts: MessageCount is ALL messages in the session (every ChatMessage.SenderType: CITIZEN, ASSISTANT,
    -- HELP_DESK, SYSTEM). Citizen and Assistant are sub-counts, so help-desk and system messages are intentionally
    -- NOT broken out here and equal MessageCount - CitizenMessageCount - AssistantMessageCount.
    [MessageCount]              INT NOT NULL CONSTRAINT [DF_ChatAnalytics_MessageCount] DEFAULT (0),
    [CitizenMessageCount]       INT NOT NULL CONSTRAINT [DF_ChatAnalytics_CitizenMessageCount] DEFAULT (0),
    [AssistantMessageCount]     INT NOT NULL CONSTRAINT [DF_ChatAnalytics_AssistantMessageCount] DEFAULT (0),
    [TotalPromptTokens]         INT NOT NULL CONSTRAINT [DF_ChatAnalytics_TotalPromptTokens] DEFAULT (0),
    [TotalCompletionTokens]     INT NOT NULL CONSTRAINT [DF_ChatAnalytics_TotalCompletionTokens] DEFAULT (0),
    [AvgResponseTimeMs]         INT NULL,
    [WasEscalatedToHelpDesk]    BIT NOT NULL CONSTRAINT [DF_ChatAnalytics_WasEscalatedToHelpDesk] DEFAULT (0),
    [ResolutionStatus]          VARCHAR(20) NULL,
    [SessionDurationSeconds]    INT NULL,
    [IsActive]                  BIT NOT NULL CONSTRAINT [DF_ChatAnalytics_IsActive] DEFAULT (1),
    [CreatedBy]                 INT NULL,
    [CreatedDate]               DATETIME NOT NULL CONSTRAINT [DF_ChatAnalytics_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]                 INT NULL,
    [UpdatedDate]                DATETIME NULL,
    [MarkedForDeletion]          BIT NOT NULL CONSTRAINT [DF_ChatAnalytics_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]      DATETIME NULL,
    CONSTRAINT [PK_ChatAnalytics] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_ChatAnalytics_ChatSessionId] UNIQUE ([ChatSessionId]),
    CONSTRAINT [FK_ChatAnalytics_ChatSession] FOREIGN KEY ([ChatSessionId]) REFERENCES [AI].[ChatSession] ([Id]),
    CONSTRAINT [FK_ChatAnalytics_QuestionCategory] FOREIGN KEY ([QuestionCategoryId]) REFERENCES [AI].[QuestionCategory] ([Id]),
    CONSTRAINT [CK_ChatAnalytics_MessageCount] CHECK ([MessageCount] >= 0),
    CONSTRAINT [CK_ChatAnalytics_CitizenMessageCount] CHECK ([CitizenMessageCount] >= 0),
    CONSTRAINT [CK_ChatAnalytics_AssistantMessageCount] CHECK ([AssistantMessageCount] >= 0),
    CONSTRAINT [CK_ChatAnalytics_MessageCountBreakdown] CHECK ([CitizenMessageCount] + [AssistantMessageCount] <= [MessageCount]),
    CONSTRAINT [CK_ChatAnalytics_TotalPromptTokens] CHECK ([TotalPromptTokens] >= 0),
    CONSTRAINT [CK_ChatAnalytics_TotalCompletionTokens] CHECK ([TotalCompletionTokens] >= 0),
    CONSTRAINT [CK_ChatAnalytics_AvgResponseTimeMs] CHECK ([AvgResponseTimeMs] IS NULL OR [AvgResponseTimeMs] >= 0),
    CONSTRAINT [CK_ChatAnalytics_ResolutionStatus] CHECK ([ResolutionStatus] IS NULL OR [ResolutionStatus] IN ('RESOLVED','UNRESOLVED','ABANDONED','ESCALATED')),
    CONSTRAINT [CK_ChatAnalytics_SessionDurationSeconds] CHECK ([SessionDurationSeconds] IS NULL OR [SessionDurationSeconds] >= 0)
);
GO
CREATE NONCLUSTERED INDEX [IX_ChatAnalytics_QuestionCategoryId] ON [AI].[ChatAnalytics] ([QuestionCategoryId] ASC);
GO

/****** Object:  Table [AI].[ChatAttachment] ******/
CREATE TABLE [AI].[ChatAttachment](
    [Id]                INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ChatMessageId]     INT NOT NULL,
    [OriginalFileName]  NVARCHAR(500) NOT NULL,
    [FileExtension]     VARCHAR(20) NOT NULL,
    [MimeType]          VARCHAR(200) NOT NULL,
    [FileSizeBytes]     BIGINT NOT NULL,
    [StorageProvider]   VARCHAR(50) NOT NULL CONSTRAINT [DF_ChatAttachment_StorageProvider] DEFAULT ('FOLDER'),
    [StoragePath]       NVARCHAR(1000) NOT NULL,
    [ChecksumSha256]    VARCHAR(64) NULL,
    [ScanStatusCode]    VARCHAR(20) NULL,
    [IsActive]          BIT NOT NULL CONSTRAINT [DF_ChatAttachment_IsActive] DEFAULT (1),
    [CreatedBy]         INT NULL,
    [CreatedDate]       DATETIME NOT NULL CONSTRAINT [DF_ChatAttachment_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]         INT NULL,
    [UpdatedDate]       DATETIME NULL,
    [MarkedForDeletion]     BIT NOT NULL CONSTRAINT [DF_ChatAttachment_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    CONSTRAINT [PK_ChatAttachment] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_ChatAttachment_ChatMessage] FOREIGN KEY ([ChatMessageId]) REFERENCES [AI].[ChatMessage] ([Id]),
    CONSTRAINT [CK_ChatAttachment_StorageProvider] CHECK ([StorageProvider] IN ('FOLDER','AWS_S3','AZURE_BLOB')),
    CONSTRAINT [CK_ChatAttachment_FileSizeBytes] CHECK ([FileSizeBytes] > 0),
    CONSTRAINT [CK_ChatAttachment_ChecksumSha256_Length] CHECK ([ChecksumSha256] IS NULL OR LEN([ChecksumSha256]) = 64),
    CONSTRAINT [CK_ChatAttachment_ScanStatusCode] CHECK ([ScanStatusCode] IS NULL OR [ScanStatusCode] IN ('PENDING','CLEAN','INFECTED','FAILED'))
);
GO
CREATE NONCLUSTERED INDEX [IX_ChatAttachment_ChatMessageId] ON [AI].[ChatAttachment] ([ChatMessageId] ASC);
GO

/****** Object:  Table [AI].[ChatFeedback] ******/
CREATE TABLE [AI].[ChatFeedback](
    [Id]                INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ChatSessionId]     INT NOT NULL,
    [ChatMessageId]     INT NULL,
    [CitizenId]         INT NULL,
    [Rating]            INT NOT NULL,
    [FeedbackType]      VARCHAR(20) NOT NULL CONSTRAINT [DF_ChatFeedback_FeedbackType] DEFAULT ('RATING'),
    [Comment]           NVARCHAR(1000) NULL,
    [SubmittedAt]       DATETIME NOT NULL CONSTRAINT [DF_ChatFeedback_SubmittedAt] DEFAULT (GETDATE()),
    [IsActive]          BIT NOT NULL CONSTRAINT [DF_ChatFeedback_IsActive] DEFAULT (1),
    [CreatedBy]         INT NULL,
    [CreatedDate]       DATETIME NOT NULL CONSTRAINT [DF_ChatFeedback_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]         INT NULL,
    [UpdatedDate]       DATETIME NULL,
    [MarkedForDeletion]     BIT NOT NULL CONSTRAINT [DF_ChatFeedback_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    CONSTRAINT [PK_ChatFeedback] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_ChatFeedback_ChatSession] FOREIGN KEY ([ChatSessionId]) REFERENCES [AI].[ChatSession] ([Id]),
    -- Composite FK: when a message is given, it must belong to ChatSessionId (skipped when ChatMessageId is NULL, i.e. session-level feedback).
    CONSTRAINT [FK_ChatFeedback_ChatMessage] FOREIGN KEY ([ChatMessageId], [ChatSessionId]) REFERENCES [AI].[ChatMessage] ([Id], [ChatSessionId]),
    CONSTRAINT [FK_ChatFeedback_Citizen] FOREIGN KEY ([CitizenId]) REFERENCES [CORE].[CitizenMaster] ([Id]),
    -- Ownership: a citizen can only leave feedback on their own session. A non-NULL CitizenId must equal ChatSession.CitizenId,
    -- so feedback with a CitizenId on an anonymous session (ChatSession.CitizenId IS NULL) is rejected.
    -- Feedback with CitizenId NULL (anonymous feedback) is not checked by this key.
    CONSTRAINT [FK_ChatFeedback_ChatSessionOwner] FOREIGN KEY ([ChatSessionId], [CitizenId]) REFERENCES [AI].[ChatSession] ([Id], [CitizenId]),
    CONSTRAINT [CK_ChatFeedback_Rating] CHECK ([Rating] BETWEEN 1 AND 5),
    CONSTRAINT [CK_ChatFeedback_FeedbackType] CHECK ([FeedbackType] IN ('RATING','THUMBS_UP','THUMBS_DOWN','COMMENT'))
);
GO
CREATE NONCLUSTERED INDEX [IX_ChatFeedback_ChatSessionId] ON [AI].[ChatFeedback] ([ChatSessionId] ASC);
GO
/* Feedback cardinality: a citizen gives at most ONE live entry per (session, message, FeedbackType).
   - ChatMessageId NULL = session-level feedback; NULLs compare equal in a unique index, so that is one per session/type too.
   - A RATING and a COMMENT on the same message are different types, so both are allowed.
   - To change an answer, update the row or set IsActive = 0 / MarkedForDeletion = 1 and insert a new one.
   - Anonymous feedback (CitizenId NULL) cannot be identified, so it is not limited here. */
CREATE UNIQUE NONCLUSTERED INDEX [UQ_ChatFeedback_OnePerCitizenSessionMessageType]
    ON [AI].[ChatFeedback] ([ChatSessionId] ASC, [ChatMessageId] ASC, [CitizenId] ASC, [FeedbackType] ASC)
    WHERE [CitizenId] IS NOT NULL AND [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO
CREATE NONCLUSTERED INDEX [IX_ChatFeedback_ChatMessageId] ON [AI].[ChatFeedback] ([ChatMessageId] ASC) WHERE [ChatMessageId] IS NOT NULL;
GO

/****** Object:  Table [AI].[EmbeddingLog] ******/
CREATE TABLE [AI].[EmbeddingLog](
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [DocumentChunkId]       INT NOT NULL,
    [ModelConfigurationId]  INT NOT NULL,
    [AttemptNumber]         INT NOT NULL CONSTRAINT [DF_EmbeddingLog_AttemptNumber] DEFAULT (1),
    [Status]                VARCHAR(20) NOT NULL,
    [ErrorMessage]          NVARCHAR(2000) NULL,
    [LatencyMs]             INT NULL,
    [QdrantPointId]         UNIQUEIDENTIFIER NULL,
    [AttemptedAt]           DATETIME NOT NULL CONSTRAINT [DF_EmbeddingLog_AttemptedAt] DEFAULT (GETDATE()),
    [IsActive]              BIT NOT NULL CONSTRAINT [DF_EmbeddingLog_IsActive] DEFAULT (1),
    [CreatedBy]             INT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_EmbeddingLog_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT NULL,
    [UpdatedDate]           DATETIME NULL,
    [MarkedForDeletion]         BIT NOT NULL CONSTRAINT [DF_EmbeddingLog_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]     DATETIME NULL,
    CONSTRAINT [PK_EmbeddingLog] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_EmbeddingLog_DocumentChunkId_AttemptNumber] UNIQUE ([DocumentChunkId], [AttemptNumber]),
    CONSTRAINT [FK_EmbeddingLog_DocumentChunk] FOREIGN KEY ([DocumentChunkId]) REFERENCES [AI].[DocumentChunk] ([Id]),
    CONSTRAINT [FK_EmbeddingLog_ModelConfiguration] FOREIGN KEY ([ModelConfigurationId]) REFERENCES [AI].[ModelConfiguration] ([Id]),
    CONSTRAINT [CK_EmbeddingLog_AttemptNumber] CHECK ([AttemptNumber] > 0),
    CONSTRAINT [CK_EmbeddingLog_Status] CHECK ([Status] IN ('SUCCESS','FAILED')),
    CONSTRAINT [CK_EmbeddingLog_LatencyMs] CHECK ([LatencyMs] IS NULL OR [LatencyMs] >= 0)
);
GO
CREATE NONCLUSTERED INDEX [IX_EmbeddingLog_Status] ON [AI].[EmbeddingLog] ([Status] ASC);
GO

/****** Object:  Table [AI].[GuidedFlow] ******/
CREATE TABLE [AI].[GuidedFlow](
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [FlowCode]              VARCHAR(50) NOT NULL,
    [FlowName]              NVARCHAR(150) NOT NULL,
    [FlowNameLocal]         NVARCHAR(200) NULL,
    [Description]           NVARCHAR(500) NULL,
    [StartNodeId]           INT NULL,
    [DisplayOrder]          INT NOT NULL CONSTRAINT [DF_GuidedFlow_DisplayOrder] DEFAULT (0),
    [IsActive]              BIT NOT NULL CONSTRAINT [DF_GuidedFlow_IsActive] DEFAULT (1),
    [CreatedBy]             INT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_GuidedFlow_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT NULL,
    [UpdatedDate]           DATETIME NULL,
    [MarkedForDeletion]         BIT NOT NULL CONSTRAINT [DF_GuidedFlow_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]     DATETIME NULL,
    CONSTRAINT [PK_GuidedFlow] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_GuidedFlow_FlowCode] UNIQUE ([FlowCode])
);
GO

/****** Object:  Table [AI].[GuidedFlowNode] ******/
CREATE TABLE [AI].[GuidedFlowNode](
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [GuidedFlowId]          INT NOT NULL,
    [NodeType]              VARCHAR(20) NOT NULL,
    [Title]                 NVARCHAR(150) NOT NULL,
    [BodyText]              NVARCHAR(2000) NULL,
    [ResultFieldCode]       VARCHAR(100) NULL,
    [NextNodeId]            INT NULL,
    [DisplayOrder]          INT NOT NULL CONSTRAINT [DF_GuidedFlowNode_DisplayOrder] DEFAULT (0),
    [IsActive]              BIT NOT NULL CONSTRAINT [DF_GuidedFlowNode_IsActive] DEFAULT (1),
    [CreatedBy]             INT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_GuidedFlowNode_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT NULL,
    [UpdatedDate]           DATETIME NULL,
    [MarkedForDeletion]     BIT NOT NULL CONSTRAINT [DF_GuidedFlowNode_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL, CONSTRAINT [PK_GuidedFlowNode] PRIMARY KEY CLUSTERED ([Id] ASC),
    -- Target for composite FKs that must prove a node belongs to a given flow (e.g. GuidedFlow.StartNodeId).
    CONSTRAINT [UQ_GuidedFlowNode_Id_GuidedFlowId] UNIQUE ([Id], [GuidedFlowId]),
    -- Target for composite FKs that must prove a node has a given type (e.g. GuidedFlowActionConfig requires 'ACTION').
    CONSTRAINT [UQ_GuidedFlowNode_Id_NodeType] UNIQUE ([Id], [NodeType]),
    CONSTRAINT [FK_GuidedFlowNode_GuidedFlow] FOREIGN KEY ([GuidedFlowId]) REFERENCES [AI].[GuidedFlow] ([Id]),
    -- Composite self-FK: the next node must belong to the same flow as this node. Skipped while NextNodeId is NULL.
    CONSTRAINT [FK_GuidedFlowNode_NextNode] FOREIGN KEY ([NextNodeId], [GuidedFlowId]) REFERENCES [AI].[GuidedFlowNode] ([Id], [GuidedFlowId]),
    CONSTRAINT [CK_GuidedFlowNode_NodeType] CHECK ([NodeType] IN ('MENU','FORM','DECISION','ACTION','MESSAGE','LOGIN'))
);
GO
CREATE NONCLUSTERED INDEX [IX_GuidedFlowNode_GuidedFlowId]  ON [AI].[GuidedFlowNode] ([GuidedFlowId] ASC);
GO
-- Composite FK: the start node must belong to this same flow (GuidedFlow.Id = GuidedFlowNode.GuidedFlowId). Skipped while StartNodeId is NULL.
ALTER TABLE [AI].[GuidedFlow] WITH CHECK ADD CONSTRAINT [FK_GuidedFlow_StartNode] FOREIGN KEY ([StartNodeId], [Id]) REFERENCES [AI].[GuidedFlowNode] ([Id], [GuidedFlowId]);
GO

/****** Object:  Table [AI].[GuidedFlowNodeOption] ******/
CREATE TABLE [AI].[GuidedFlowNodeOption](
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [GuidedFlowNodeId]      INT NOT NULL,
    [OptionLabel]           NVARCHAR(150) NOT NULL,
    [OptionValue]           VARCHAR(100) NOT NULL,
    [NextNodeId]            INT NULL,
    /* ConditionExpression: restricted rule text, NEVER executed as SQL or script. The application parses it with a strict
       parser and evaluates it in memory against the values collected so far (GuidedFlowSession.CollectedDataJson).
       Grammar (single comparison, no chaining, no functions, no sub-expressions):
           <FieldCode> <operator> <literal>
           FieldCode : a GuidedFlowFormField.FieldCode of this flow, [A-Za-z][A-Za-z0-9_]*
           operator  : =  <>  !=  >  >=  <  <=
           literal   : number (e.g. 5000, 12.5) or single-quoted ASCII string (e.g. 'WARD_1')
       Example: OutstandingAmount > 5000
       The CHECK below only blocks unsafe characters/comment markers; the parser must still reject anything that is not
       exactly this grammar, and unknown FieldCodes, before evaluating. */
    [ConditionExpression]   NVARCHAR(300) NULL,
    [DisplayOrder]          INT NOT NULL CONSTRAINT [DF_GuidedFlowNodeOption_DisplayOrder] DEFAULT (0),
    [IsActive]              BIT NOT NULL CONSTRAINT [DF_GuidedFlowNodeOption_IsActive] DEFAULT (1),
    [CreatedBy]             INT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_GuidedFlowNodeOption_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT NULL,
    [UpdatedDate]           DATETIME NULL,
    [MarkedForDeletion]         BIT NOT NULL CONSTRAINT [DF_GuidedFlowNodeOption_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]     DATETIME NULL,
    CONSTRAINT [PK_GuidedFlowNodeOption] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_GuidedFlowNodeOption_GuidedFlowNodeId_OptionValue] UNIQUE ([GuidedFlowNodeId], [OptionValue]),
    -- Character allow-list: letters, digits, space and _ < > = ! ' . - only. Rules out ; ( ) , / * [ ] etc., and '--' comments.
    CONSTRAINT [CK_GuidedFlowNodeOption_ConditionExpression] CHECK ([ConditionExpression] IS NULL OR (
        LEN([ConditionExpression]) > 0
        AND [ConditionExpression] NOT LIKE '%[^A-Za-z0-9_ <>=!''.-]%'
        AND [ConditionExpression] NOT LIKE '%--%')),
    CONSTRAINT [FK_GuidedFlowNodeOption_GuidedFlowNode] FOREIGN KEY ([GuidedFlowNodeId]) REFERENCES [AI].[GuidedFlowNode] ([Id]),
    CONSTRAINT [FK_GuidedFlowNodeOption_NextNode] FOREIGN KEY ([NextNodeId]) REFERENCES [AI].[GuidedFlowNode] ([Id])
);
GO

/* An option's target node must be in the same flow as the node that owns the option.
   The option row has no GuidedFlowId of its own (it is derived from GuidedFlowNodeId), so a composite FK is not possible; a trigger checks it instead. */
CREATE OR ALTER TRIGGER [AI].[TR_GuidedFlowNodeOption_NextNodeSameFlow] ON [AI].[GuidedFlowNodeOption]
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted I
        JOIN [AI].[GuidedFlowNode] S ON S.[Id] = I.[GuidedFlowNodeId]
        JOIN [AI].[GuidedFlowNode] T ON T.[Id] = I.[NextNodeId]
        WHERE I.[NextNodeId] IS NOT NULL
          AND S.[GuidedFlowId] <> T.[GuidedFlowId]
    )
        THROW 51005, 'A guided-flow option cannot lead to a node that belongs to a different flow.', 1;
END;
GO

/****** Object:  Table [AI].[GuidedFlowFormField] ******/
CREATE TABLE [AI].[GuidedFlowFormField](
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [GuidedFlowNodeId]      INT NOT NULL,
    [FieldCode]             VARCHAR(100) NOT NULL,
    [FieldLabel]            NVARCHAR(150) NOT NULL,
    [FieldType]             VARCHAR(20) NOT NULL CONSTRAINT [DF_GuidedFlowFormField_FieldType] DEFAULT ('TEXT'),
    [IsRequired]            BIT NOT NULL CONSTRAINT [DF_GuidedFlowFormField_IsRequired] DEFAULT (1),
    [SelectOptionsJson]     NVARCHAR(4000) NULL,
    [DisplayOrder]          INT NOT NULL CONSTRAINT [DF_GuidedFlowFormField_DisplayOrder] DEFAULT (0),
    [IsActive]              BIT NOT NULL CONSTRAINT [DF_GuidedFlowFormField_IsActive] DEFAULT (1),
    [CreatedBy]             INT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_GuidedFlowFormField_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT NULL,
    [UpdatedDate]           DATETIME NULL,
    [MarkedForDeletion]         BIT NOT NULL CONSTRAINT [DF_GuidedFlowFormField_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]     DATETIME NULL,
    CONSTRAINT [PK_GuidedFlowFormField] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_GuidedFlowFormField_GuidedFlowNodeId_FieldCode] UNIQUE ([GuidedFlowNodeId], [FieldCode]),
    CONSTRAINT [FK_GuidedFlowFormField_GuidedFlowNode] FOREIGN KEY ([GuidedFlowNodeId]) REFERENCES [AI].[GuidedFlowNode] ([Id]),
    CONSTRAINT [CK_GuidedFlowFormField_SelectOptionsJson_IsJson] CHECK ([SelectOptionsJson] IS NULL OR ISJSON([SelectOptionsJson]) = 1),
    CONSTRAINT [CK_GuidedFlowFormField_SelectOptionsRequired] CHECK ([FieldType] <> 'SELECT' OR ([SelectOptionsJson] IS NOT NULL AND ISJSON([SelectOptionsJson]) = 1)),
    CONSTRAINT [CK_GuidedFlowFormField_FieldType] CHECK ([FieldType] IN ('TEXT','NUMBER','DATE','FILE','SELECT','TEXTAREA'))
);
GO

/****** Object:  Table [AI].[GuidedFlowActionConfig] ******/
CREATE TABLE [AI].[GuidedFlowActionConfig](
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [GuidedFlowNodeId]      INT NOT NULL,
    [NodeType]              VARCHAR(20) NOT NULL CONSTRAINT [DF_GuidedFlowActionConfig_NodeType] DEFAULT ('ACTION'),   -- Always 'ACTION'; exists so the FK can enforce the node's type
    [ActionType]            VARCHAR(50) NOT NULL CONSTRAINT [DF_GuidedFlowActionConfig_ActionType] DEFAULT ('GENERIC_STORAGE'),
    [ConfigJson]            NVARCHAR(4000) NULL,
    [IsActive]              BIT NOT NULL CONSTRAINT [DF_GuidedFlowActionConfig_IsActive] DEFAULT (1),
    [CreatedBy]             INT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_GuidedFlowActionConfig_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT NULL,
    [UpdatedDate]           DATETIME NULL,
    [MarkedForDeletion]         BIT NOT NULL CONSTRAINT [DF_GuidedFlowActionConfig_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]     DATETIME NULL,
    CONSTRAINT [PK_GuidedFlowActionConfig] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_GuidedFlowActionConfig_GuidedFlowNodeId] UNIQUE ([GuidedFlowNodeId]),
    -- Composite FK: the node must exist and be an ACTION node (NodeType is pinned to 'ACTION' below).
    CONSTRAINT [FK_GuidedFlowActionConfig_GuidedFlowNode] FOREIGN KEY ([GuidedFlowNodeId], [NodeType]) REFERENCES [AI].[GuidedFlowNode] ([Id], [NodeType]),
    CONSTRAINT [CK_GuidedFlowActionConfig_NodeType] CHECK ([NodeType] = 'ACTION'),
    -- ActionType selects the handler the application runs, so it is a closed set. Adding an action = new handler + extend this list
    -- (and CK_GuidedFlowSubmission_ActionType, which must stay identical).
    CONSTRAINT [CK_GuidedFlowActionConfig_ConfigJson_IsJson] CHECK ([ConfigJson] IS NULL OR ISJSON([ConfigJson]) = 1),
    CONSTRAINT [CK_GuidedFlowActionConfig_ActionType] CHECK ([ActionType] IN ('GENERIC_STORAGE','GRIEVANCE_SUBMISSION'))
);
GO

/****** Object:  Table [AI].[GuidedFlowSession] ******/
CREATE TABLE [AI].[GuidedFlowSession](
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ChatSessionId]         INT NOT NULL,
    [GuidedFlowId]          INT NOT NULL,
    [CurrentNodeId]         INT NULL,
    [CollectedDataJson]     NVARCHAR(4000) NULL,
    [Status]                VARCHAR(20) NOT NULL CONSTRAINT [DF_GuidedFlowSession_Status] DEFAULT ('IN_PROGRESS'),
    [StartedAt]             DATETIME NOT NULL CONSTRAINT [DF_GuidedFlowSession_StartedAt] DEFAULT (GETDATE()),
    [CompletedAt]           DATETIME NULL,
    [IsActive]              BIT NOT NULL CONSTRAINT [DF_GuidedFlowSession_IsActive] DEFAULT (1),
    [CreatedBy]             INT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_GuidedFlowSession_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT NULL,
    [UpdatedDate]           DATETIME NULL,
    [MarkedForDeletion]         BIT NOT NULL CONSTRAINT [DF_GuidedFlowSession_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]     DATETIME NULL,
    CONSTRAINT [PK_GuidedFlowSession] PRIMARY KEY CLUSTERED ([Id] ASC),
    -- Target for composite FKs that must prove a session belongs to a given flow (e.g. GuidedFlowSubmission).
    CONSTRAINT [UQ_GuidedFlowSession_Id_GuidedFlowId] UNIQUE ([Id], [GuidedFlowId]),
    CONSTRAINT [FK_GuidedFlowSession_ChatSession] FOREIGN KEY ([ChatSessionId]) REFERENCES [AI].[ChatSession] ([Id]),
    CONSTRAINT [FK_GuidedFlowSession_GuidedFlow] FOREIGN KEY ([GuidedFlowId]) REFERENCES [AI].[GuidedFlow] ([Id]),
    -- Composite FK: the current node must belong to this session's flow. Skipped while CurrentNodeId is NULL.
    CONSTRAINT [FK_GuidedFlowSession_CurrentNode] FOREIGN KEY ([CurrentNodeId], [GuidedFlowId]) REFERENCES [AI].[GuidedFlowNode] ([Id], [GuidedFlowId]),
    CONSTRAINT [CK_GuidedFlowSession_CompletedAt_Required] CHECK ([Status] <> 'COMPLETED' OR [CompletedAt] IS NOT NULL),
    CONSTRAINT [CK_GuidedFlowSession_CompletedAfterStart] CHECK ([CompletedAt] IS NULL OR [CompletedAt] >= [StartedAt]),
    CONSTRAINT [CK_GuidedFlowSession_CollectedDataJson_IsJson] CHECK ([CollectedDataJson] IS NULL OR ISJSON([CollectedDataJson]) = 1),
    CONSTRAINT [CK_GuidedFlowSession_Status] CHECK ([Status] IN ('IN_PROGRESS','COMPLETED','ABANDONED'))
);
GO
CREATE NONCLUSTERED INDEX [IX_GuidedFlowSession_ChatSessionId] ON [AI].[GuidedFlowSession] ([ChatSessionId] ASC);
GO

/****** Object:  Table [AI].[GuidedFlowSubmission] ******/
CREATE TABLE [AI].[GuidedFlowSubmission](
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [GuidedFlowSessionId]   INT NOT NULL,
    [GuidedFlowId]          INT NOT NULL,
    [CitizenId]             INT NULL,
    [SubmissionDataJson]    NVARCHAR(4000) NOT NULL,
    [ActionType]            VARCHAR(50) NOT NULL,
    -- Polymorphic result link (what the action produced). ResultReferenceType is a controlled value (only 'Grievance' today) and
    -- ResultReferenceId is the row id in that type's table. Both are NULL until the action has produced a result.
    -- Referential integrity is enforced per type through a persisted computed column + real FK (ResultGrievanceId below).
    -- Adding a result type = extend CK_GuidedFlowSubmission_ResultReferenceType + add another computed column and FK.
    [ResultReferenceType]   VARCHAR(50) NULL,
    [ResultReferenceId]     INT NULL,
    [ResultGrievanceId]     AS (CASE WHEN [ResultReferenceType] = 'Grievance' THEN [ResultReferenceId] END) PERSISTED,
    [Status]                VARCHAR(20) NOT NULL CONSTRAINT [DF_GuidedFlowSubmission_Status] DEFAULT ('PENDING_REVIEW'),
    [IsActive]              BIT NOT NULL CONSTRAINT [DF_GuidedFlowSubmission_IsActive] DEFAULT (1),
    [CreatedBy]             INT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_GuidedFlowSubmission_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT NULL,
    [UpdatedDate]           DATETIME NULL,
    [MarkedForDeletion]         BIT NOT NULL CONSTRAINT [DF_GuidedFlowSubmission_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]     DATETIME NULL,
    CONSTRAINT [PK_GuidedFlowSubmission] PRIMARY KEY CLUSTERED ([Id] ASC),
    -- Composite FK: the submission's flow must be the flow its session was running.
    CONSTRAINT [FK_GuidedFlowSubmission_GuidedFlowSession] FOREIGN KEY ([GuidedFlowSessionId], [GuidedFlowId]) REFERENCES [AI].[GuidedFlowSession] ([Id], [GuidedFlowId]),
    CONSTRAINT [FK_GuidedFlowSubmission_GuidedFlow] FOREIGN KEY ([GuidedFlowId]) REFERENCES [AI].[GuidedFlow] ([Id]),
    CONSTRAINT [FK_GuidedFlowSubmission_Citizen] FOREIGN KEY ([CitizenId]) REFERENCES [CORE].[CitizenMaster] ([Id]),
    CONSTRAINT [FK_GuidedFlowSubmission_ResultGrievance] FOREIGN KEY ([ResultGrievanceId]) REFERENCES [CORE].[Grievance] ([Id]),
    CONSTRAINT [CK_GuidedFlowSubmission_ResultReferenceType] CHECK ([ResultReferenceType] IS NULL OR [ResultReferenceType] IN ('Grievance')),
    CONSTRAINT [CK_GuidedFlowSubmission_ResultReference_Pair] CHECK (([ResultReferenceType] IS NULL AND [ResultReferenceId] IS NULL) OR ([ResultReferenceType] IS NOT NULL AND [ResultReferenceId] IS NOT NULL)),
    -- Only the grievance action produces a result reference; GENERIC_STORAGE submissions carry none.
    CONSTRAINT [CK_GuidedFlowSubmission_ResultReference_ActionType] CHECK ([ResultReferenceType] IS NULL OR [ActionType] = 'GRIEVANCE_SUBMISSION'),
    CONSTRAINT [CK_GuidedFlowSubmission_SubmissionDataJson_IsJson] CHECK (ISJSON([SubmissionDataJson]) = 1),
    CONSTRAINT [CK_GuidedFlowSubmission_ActionType] CHECK ([ActionType] IN ('GENERIC_STORAGE','GRIEVANCE_SUBMISSION')),
    CONSTRAINT [CK_GuidedFlowSubmission_Status] CHECK ([Status] IN ('PENDING_REVIEW','PROCESSED'))
);
GO
CREATE NONCLUSTERED INDEX [IX_GuidedFlowSubmission_GuidedFlowSessionId] ON [AI].[GuidedFlowSubmission] ([GuidedFlowSessionId] ASC);
GO
CREATE NONCLUSTERED INDEX [IX_GuidedFlowSubmission_Status] ON [AI].[GuidedFlowSubmission] ([Status] ASC);
GO
CREATE NONCLUSTERED INDEX [IX_GuidedFlowSubmission_CitizenId] ON [AI].[GuidedFlowSubmission] ([CitizenId] ASC) WHERE [CitizenId] IS NOT NULL;
GO
-- Filter uses the real ResultReferenceType column: SQL Server does not allow a computed column inside a filter expression.
CREATE NONCLUSTERED INDEX [IX_GuidedFlowSubmission_ResultGrievanceId] ON [AI].[GuidedFlowSubmission] ([ResultGrievanceId] ASC) WHERE [ResultReferenceType] = 'Grievance';
GO

/****** Object:  View [AI].[vw_CitizenContext] ******/
-- PII: this view feeds the LLM prompt and deliberately carries NO direct contact identifiers (mobile number, email).
-- Those live in [AI].[vw_CitizenContactDetails] below, which must be granted only to roles that are allowed to see them.
CREATE VIEW [AI].[vw_CitizenContext] AS
SELECT
    c.[Id]                                          AS CitizenId,
    c.[Name]                                     AS CitizenFullName,
    u.[Language]                                     AS CitizenLanguage,
    s.[Id]                                           AS SubmissionId,
    gf.[FlowName]                                    AS RequestType,
    JSON_VALUE(s.[SubmissionDataJson], '$.Subject')  AS SubmissionSummary,
    s.[Status]                                       AS SubmissionStatus,
    s.[CreatedDate]                                  AS SubmittedDate,
    s.[ResultReferenceType]                          AS ResultReferenceType,
    g.[Status]                                       AS GrievanceStatus,
    g.[ResolutionNotes]                              AS GrievanceResolutionNotes,
    g.[ResolvedDate]                                 AS GrievanceResolvedDate
FROM [CORE].[CitizenMaster] c
LEFT JOIN [AI].[UserDetails] u ON u.[CitizenId] = c.[Id] AND u.[MarkedForDeletion] = 0 AND u.[IsActive] = 1
LEFT JOIN [AI].[GuidedFlowSubmission] s ON s.[CitizenId] = c.[Id] AND s.[MarkedForDeletion] = 0 AND s.[IsActive] = 1
LEFT JOIN [AI].[GuidedFlow] gf ON gf.[Id] = s.[GuidedFlowId]
LEFT JOIN [CORE].[Grievance] g ON g.[Id] = s.[ResultGrievanceId] AND g.[MarkedForDeletion] = 0 AND g.[IsActive] = 1
WHERE c.[IsActive] = 1;
GO

/****** Object:  View [AI].[vw_CitizenContactDetails] ******/
-- PII (mobile number, email). Restricted: do NOT grant SELECT to general application/reporting roles or to the LLM
-- context path. Grant it only to the specific role(s) that are authorised to read contact details, e.g.:
--     GRANT SELECT ON [AI].[vw_CitizenContactDetails] TO [<authorised_role>];
-- and keep it out of AI.CitizenContextFieldMetadata unless the disclosure has been explicitly approved.
CREATE VIEW [AI].[vw_CitizenContactDetails] AS
SELECT
    c.[Id]          AS CitizenId,
    c.[MobileNo]    AS CitizenMobileNo,
    u.[Email]       AS CitizenEmail
FROM [CORE].[CitizenMaster] c
LEFT JOIN [AI].[UserDetails] u ON u.[CitizenId] = c.[Id] AND u.[MarkedForDeletion] = 0 AND u.[IsActive] = 1
WHERE c.[IsActive] = 1;
GO

/****** Object:  Table [AI].[CitizenContextFieldMetadata] ******/
CREATE TABLE [AI].[CitizenContextFieldMetadata](
    [Id]                INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ColumnName]        VARCHAR(128) NOT NULL,
    [FieldLabel]        NVARCHAR(150) NOT NULL,
    [FieldDescription]  NVARCHAR(500) NULL,
    [DisplayOrder]      INT NOT NULL CONSTRAINT [DF_CitizenContextFieldMetadata_DisplayOrder] DEFAULT (0),
    [IsActive]          BIT NOT NULL CONSTRAINT [DF_CitizenContextFieldMetadata_IsActive] DEFAULT (1),
    [CreatedBy]         INT NULL,
    [CreatedDate]       DATETIME NOT NULL CONSTRAINT [DF_CitizenContextFieldMetadata_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]         INT NULL,
    [UpdatedDate]       DATETIME NULL,
    [MarkedForDeletion]     BIT NOT NULL CONSTRAINT [DF_CitizenContextFieldMetadata_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    CONSTRAINT [PK_CitizenContextFieldMetadata] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_CitizenContextFieldMetadata_ColumnName] UNIQUE ([ColumnName])
);
GO

/* ColumnName must name a real column of AI.vw_CitizenContext. Synchronisation strategy:
     1. Write time  : TR_CitizenContextFieldMetadata_ColumnExists rejects any inserted/renamed ColumnName that is not a column of the view.
     2. View change : a column removed/renamed in the view leaves a stale metadata row behind, which a write-time trigger cannot catch.
                      Any script that alters AI.vw_CitizenContext must then query AI.vw_CitizenContextFieldMetadataDrift and fix every
                      METADATA_WITHOUT_COLUMN row (delete or rename it) in the same change.
     3. New column  : a view column with no active metadata row is silently left out of the LLM prompt (safe default). It shows up in the
                      drift view as COLUMN_WITHOUT_METADATA; that is expected for internal columns (CitizenId, ResultReferenceType) and a
                      to-do for anything else that should be described. */
CREATE OR ALTER TRIGGER [AI].[TR_CitizenContextFieldMetadata_ColumnExists] ON [AI].[CitizenContextFieldMetadata]
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted I
        LEFT JOIN deleted D ON D.[Id] = I.[Id]
        WHERE (D.[Id] IS NULL OR D.[ColumnName] <> I.[ColumnName])          -- new row, or ColumnName changed
          AND NOT EXISTS (
                SELECT 1
                FROM sys.columns C
                WHERE C.[object_id] = OBJECT_ID(N'[AI].[vw_CitizenContext]')
                  AND C.[name] COLLATE DATABASE_DEFAULT = I.[ColumnName] COLLATE DATABASE_DEFAULT)
    )
        THROW 51006, 'CitizenContextFieldMetadata.ColumnName must be a column of AI.vw_CitizenContext.', 1;
END;
GO

/* Drift report between the metadata table and the actual columns of AI.vw_CitizenContext (only the intentionally undescribed internal columns should appear when in sync). */
CREATE VIEW [AI].[vw_CitizenContextFieldMetadataDrift] AS
SELECT m.[ColumnName] COLLATE DATABASE_DEFAULT AS ColumnName, CAST('METADATA_WITHOUT_COLUMN' AS VARCHAR(30)) AS DriftType
FROM [AI].[CitizenContextFieldMetadata] m
WHERE m.[MarkedForDeletion] = 0
  AND NOT EXISTS (SELECT 1 FROM sys.columns c
                  WHERE c.[object_id] = OBJECT_ID(N'[AI].[vw_CitizenContext]')
                    AND c.[name] COLLATE DATABASE_DEFAULT = m.[ColumnName] COLLATE DATABASE_DEFAULT)
UNION ALL
SELECT c.[name] COLLATE DATABASE_DEFAULT, 'COLUMN_WITHOUT_METADATA'
FROM sys.columns c
WHERE c.[object_id] = OBJECT_ID(N'[AI].[vw_CitizenContext]')
  AND NOT EXISTS (SELECT 1 FROM [AI].[CitizenContextFieldMetadata] m
                  WHERE m.[MarkedForDeletion] = 0
                    AND m.[ColumnName] COLLATE DATABASE_DEFAULT = c.[name] COLLATE DATABASE_DEFAULT);
GO

/****** Object:  Table [AI].[EvaluationCase] ******/
CREATE TABLE [AI].[EvaluationCase](
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [Question]              NVARCHAR(500) NOT NULL,
    [ExpectedRouteType]      VARCHAR(20) NOT NULL,
    [ExpectedChatIntentId]   INT NULL,      -- FK to AI.ChatIntent; the intent code is read through the join
    [ExpectedMcpToolSecurityId] INT NULL,   -- FK to AI.McpToolSecurity (the tool registry); server/tool names are read through the join
    [IsActive]               BIT NOT NULL CONSTRAINT [DF_EvaluationCase_IsActive] DEFAULT (1),
    [CreatedBy]              INT NULL,
    [CreatedDate]            DATETIME NOT NULL CONSTRAINT [DF_EvaluationCase_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]              INT NULL,
    [UpdatedDate]            DATETIME NULL,
    [MarkedForDeletion]      BIT NOT NULL CONSTRAINT [DF_EvaluationCase_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]  DATETIME NULL,
    CONSTRAINT [PK_EvaluationCase] PRIMARY KEY CLUSTERED ([Id] ASC),
    -- Composite FK: the expected intent must exist AND its route type must equal ExpectedRouteType (skipped when no intent is expected).
    CONSTRAINT [FK_EvaluationCase_ChatIntent] FOREIGN KEY ([ExpectedChatIntentId], [ExpectedRouteType]) REFERENCES [AI].[ChatIntent] ([Id], [RouteType]),
    CONSTRAINT [FK_EvaluationCase_McpToolSecurity] FOREIGN KEY ([ExpectedMcpToolSecurityId]) REFERENCES [AI].[McpToolSecurity] ([Id]),
    CONSTRAINT [CK_EvaluationCase_ExpectedRouteType] CHECK ([ExpectedRouteType] IN ('CHAT_KB','RAG','DATA','ACTION','REPORT','CLARIFICATION','MULTI_STEP'))
);
GO


