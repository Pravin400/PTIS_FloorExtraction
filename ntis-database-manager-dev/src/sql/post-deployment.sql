

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO


/*==============================================================================
    1. FUNCTION: GET CHANGED FIELDS
==============================================================================*/

CREATE OR ALTER FUNCTION CORE.fn_GetChangedFields
(
    @OldJson NVARCHAR(MAX),
    @NewJson NVARCHAR(MAX)
)
RETURNS NVARCHAR(MAX)
AS
BEGIN

    DECLARE @Result NVARCHAR(MAX);

    IF @OldJson IS NULL
       OR @NewJson IS NULL
        RETURN N'[]';


    ;WITH OldValues AS
    (
        SELECT
            [key] AS FieldName,
            value AS OldValue,
            CAST([type] AS INT) AS OldType
        FROM OPENJSON(@OldJson)
    ),
    NewValues AS
    (
        SELECT
            [key] AS FieldName,
            value AS NewValue,
            CAST([type] AS INT) AS NewType
        FROM OPENJSON(@NewJson)
    ),
    ChangedFields AS
    (
        SELECT
            COALESCE(O.FieldName, N.FieldName) AS FieldName,
            O.OldValue,
            N.NewValue
        FROM OldValues O
        FULL OUTER JOIN NewValues N
            ON N.FieldName = O.FieldName
        WHERE
            COALESCE(O.FieldName, N.FieldName)
            NOT IN
            (
                'CreatedBy',
                'CreatedDate',
                'UpdatedBy',
                'UpdatedDate'
            )
            AND
            (
                ISNULL(O.OldValue, N'<<NULL>>')
                <>
                ISNULL(N.NewValue, N'<<NULL>>')

                OR

                COALESCE(O.OldType, -1)
                <>
                COALESCE(N.NewType, -1)
            )
    )
    SELECT
        @Result =
        (
            SELECT
                FieldName AS [Field],
                OldValue AS [OldValue],
                NewValue AS [NewValue]
            FROM ChangedFields
            ORDER BY FieldName
            FOR JSON PATH, INCLUDE_NULL_VALUES
        );

    RETURN ISNULL(@Result, N'[]');

END;
GO



/*==============================================================================
    2. SP: ADD CDC TABLE
==============================================================================*/

CREATE OR ALTER PROCEDURE CORE.usp_AddCdcTable
(
    @DepartmentCode VARCHAR(20),
    @SourceSchema VARCHAR(128),
    @SourceTable VARCHAR(128),
    @ProcessingType VARCHAR(20),
    @EntityType VARCHAR(50) = NULL,
    @CalculationType VARCHAR(20) = NULL,
    @TriggersRecalculation BIT = 1,
    @ResetCheckpoint BIT = 0
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE
        @CaptureInstance VARCHAR(200),
        @SourceObjectId INT,
        @CurrentMaxLsn BINARY(10),
        @MinAvailableLsn BINARY(10),
        @LastProcessedLsn BINARY(10),
        @CdcWasAlreadyEnabled BIT;

    SET @DepartmentCode = UPPER(LTRIM(RTRIM(@DepartmentCode)));
    SET @SourceSchema = LTRIM(RTRIM(@SourceSchema));
    SET @SourceTable = LTRIM(RTRIM(@SourceTable));
    SET @ProcessingType = UPPER(LTRIM(RTRIM(@ProcessingType)));
    SET @EntityType = CASE WHEN @EntityType IS NULL THEN NULL ELSE UPPER(LTRIM(RTRIM(@EntityType))) END;
    SET @CalculationType = CASE WHEN @CalculationType IS NULL THEN NULL ELSE UPPER(LTRIM(RTRIM(@CalculationType))) END;

    IF (SELECT is_cdc_enabled FROM sys.databases WHERE database_id = DB_ID()) <> 1
        THROW 51001, 'CDC is not enabled on current database.', 1;

    SET @SourceObjectId = OBJECT_ID(QUOTENAME(@SourceSchema) + '.' + QUOTENAME(@SourceTable), 'U');
    IF @SourceObjectId IS NULL
        THROW 51002, 'Source table does not exist.', 1;

    IF @ProcessingType NOT IN ('ENTITY','MASTER','AUDIT')
        THROW 51003, 'ProcessingType must be ENTITY, MASTER or AUDIT.', 1;

    IF @ProcessingType = 'ENTITY' AND @EntityType IS NULL
        THROW 51004, 'EntityType required for ENTITY processing.', 1;

    SET @CaptureInstance = @SourceSchema + '_' + @SourceTable;
    IF LEN(@CaptureInstance) > 100
        THROW 51005, 'Capture instance name too long.', 1;

    IF EXISTS
    (
        SELECT 1
        FROM cdc.change_tables
        WHERE capture_instance = @CaptureInstance
          AND source_object_id <> @SourceObjectId
    )
        THROW 51006, 'Capture instance already belongs to another source table.', 1;

    SET @CdcWasAlreadyEnabled = CASE WHEN EXISTS
    (
        SELECT 1 FROM cdc.change_tables WHERE capture_instance = @CaptureInstance
    ) THEN 1 ELSE 0 END;

    IF @CdcWasAlreadyEnabled = 0
    BEGIN
        EXEC sys.sp_cdc_enable_table
            @source_schema = @SourceSchema,
            @source_name = @SourceTable,
            @role_name = NULL,
            @capture_instance = @CaptureInstance,
            @supports_net_changes = 0;
    END;

    IF NOT EXISTS (SELECT 1 FROM cdc.change_tables WHERE capture_instance = @CaptureInstance)
        THROW 51007, 'CDC capture instance could not be created.', 1;

    SET @CurrentMaxLsn = sys.fn_cdc_get_max_lsn();
    SET @MinAvailableLsn = sys.fn_cdc_get_min_lsn(@CaptureInstance);

    IF EXISTS (SELECT 1 FROM CORE.CdcTableConfig WHERE CaptureInstance = @CaptureInstance)
    BEGIN
        UPDATE CORE.CdcTableConfig
        SET DepartmentCode = @DepartmentCode,
            SourceSchema = @SourceSchema,
            SourceTable = @SourceTable,
            ProcessingType = @ProcessingType,
            EntityType = @EntityType,
            CalculationType = @CalculationType,
            TriggersRecalculation = @TriggersRecalculation,
            IsActive = 1,
            UpdatedDate = GETDATE()
        WHERE CaptureInstance = @CaptureInstance;
    END
    ELSE
    BEGIN
        INSERT INTO CORE.CdcTableConfig
        (
            DepartmentCode, CaptureInstance, SourceSchema, SourceTable,
            ProcessingType, EntityType, CalculationType,
            TriggersRecalculation, IsActive, CreatedDate
        )
        VALUES
        (
            @DepartmentCode, @CaptureInstance, @SourceSchema, @SourceTable,
            @ProcessingType, @EntityType, @CalculationType,
            @TriggersRecalculation, 1, GETDATE()
        );
    END;

    IF NOT EXISTS
    (
        SELECT 1 FROM CORE.CdcProcessingCheckpoint WHERE CaptureInstance = @CaptureInstance
    )
    BEGIN
        INSERT INTO CORE.CdcProcessingCheckpoint
        (
            CaptureInstance, SourceSchema, SourceTable,
            LastProcessedLsn, LastProcessedAt,
            LastError, LastErrorAt, IsActive, CreatedDate
        )
        VALUES
        (
            @CaptureInstance, @SourceSchema, @SourceTable,
            @CurrentMaxLsn, SYSDATETIME(),
            NULL, NULL, 1, GETDATE()
        );
    END
    ELSE IF @ResetCheckpoint = 1 OR @CdcWasAlreadyEnabled = 0
    BEGIN
        UPDATE CORE.CdcProcessingCheckpoint
        SET SourceSchema = @SourceSchema,
            SourceTable = @SourceTable,
            LastProcessedLsn = @CurrentMaxLsn,
            LastProcessedAt = SYSDATETIME(),
            LastError = NULL,
            LastErrorAt = NULL,
            IsActive = 1,
            UpdatedDate = GETDATE()
        WHERE CaptureInstance = @CaptureInstance;
    END
    ELSE
    BEGIN
        UPDATE CORE.CdcProcessingCheckpoint
        SET SourceSchema = @SourceSchema,
            SourceTable = @SourceTable,
            IsActive = 1,
            UpdatedDate = GETDATE()
        WHERE CaptureInstance = @CaptureInstance;
    END;

    SELECT @LastProcessedLsn = LastProcessedLsn
    FROM CORE.CdcProcessingCheckpoint
    WHERE CaptureInstance = @CaptureInstance;

    SELECT
        @DepartmentCode AS DepartmentCode,
        @CaptureInstance AS CaptureInstance,
        @SourceSchema AS SourceSchema,
        @SourceTable AS SourceTable,
        @ProcessingType AS ProcessingType,
        @EntityType AS EntityType,
        @CalculationType AS CalculationType,
        CASE
            WHEN @LastProcessedLsn IS NULL THEN 'CHECKPOINT_MISSING'
            WHEN @MinAvailableLsn IS NOT NULL AND @LastProcessedLsn < @MinAvailableLsn THEN 'RETENTION_GAP'
            ELSE 'READY'
        END AS ProcessorStatus;
END;
GO


/*==============================================================================
    3. SP: SET-BASED ENTITY RESOLVER
==============================================================================*/

CREATE OR ALTER PROCEDURE CORE.usp_ResolveCdcEntityBatch
(
    @DepartmentCode VARCHAR(20),
    @SourceSchema VARCHAR(128),
    @SourceTable VARCHAR(128)
)
AS
BEGIN
    SET NOCOUNT ON;
 IF OBJECT_ID('tempdb..#Events') IS NULL
         THROW 51500, '#Events temp table not found; this procedure must be executed from within CORE.usp_ProcessCdcCaptureInstance.', 1;
    DECLARE
        @ResolverType VARCHAR(20),
        @EntityType VARCHAR(50),

        @SourceEntityColumn VARCHAR(128),

        @ParentSchema VARCHAR(128),
        @ParentTable VARCHAR(128),
        @ParentJoinColumn VARCHAR(128),
        @ParentEntityColumn VARCHAR(128),

        @CustomResolverProcedure NVARCHAR(256),

        @Sql NVARCHAR(MAX),
        @Detail NVARCHAR(500),

        @JsonPath NVARCHAR(4000);


    SELECT
        @ResolverType =
            ResolverType,

        @EntityType =
            EntityType,

        @SourceEntityColumn =
            SourceEntityColumn,

        @ParentSchema =
            ParentSchema,

        @ParentTable =
            ParentTable,

        @ParentJoinColumn =
            ParentJoinColumn,

        @ParentEntityColumn =
            ParentEntityColumn,

        @CustomResolverProcedure =
            CustomResolverProcedure

    FROM CORE.CdcEntityResolverConfig

    WHERE DepartmentCode =
          @DepartmentCode

      AND SourceSchema =
          @SourceSchema

      AND SourceTable =
          @SourceTable

      AND IsActive =
          1;


    IF @ResolverType IS NULL
    BEGIN

        UPDATE #Events

        SET
            EntityResolutionStatus =
                'UNRESOLVED',

            EntityResolutionDetail =
                'Resolver configuration not found.';

        RETURN;

    END;


    /*==============================================================
        DIRECT
    ==============================================================*/

    IF @ResolverType = 'DIRECT'
    BEGIN

        IF @SourceEntityColumn IS NULL
        BEGIN

            UPDATE #Events

            SET
                EntityType =
                    @EntityType,

                EntityResolutionStatus =
                    'UNRESOLVED',

                EntityResolutionDetail =
                    'SourceEntityColumn is not configured.';

            RETURN;

        END;


        SET @JsonPath =
            N'$.'
            + @SourceEntityColumn;


        SET @Detail =
            CONCAT
            (
                @SourceSchema,
                '.',
                @SourceTable,
                '.',
                @SourceEntityColumn
            );


        SET @Sql =
        N'
        UPDATE E

        SET
            EntityType =
                @EntityTypeIn,

            EntityId =
                TRY_CONVERT
                (
                    INT,
                    V.EntityValueRaw
                ),

            EntityResolutionStatus =
                CASE

                    WHEN TRY_CONVERT
                         (
                             INT,
                             V.EntityValueRaw
                         ) IS NULL

                    THEN
                        ''UNRESOLVED''

                    ELSE
                        ''DIRECT''

                END,

            EntityResolutionDetail =
                CASE

                    WHEN TRY_CONVERT
                         (
                             INT,
                             V.EntityValueRaw
                         ) IS NULL

                    THEN
                        ''Direct entity value not found.''

                    ELSE
                        @DetailIn

                END

        FROM #Events E

        CROSS APPLY
        (
            -- A DELETE only has OldValues; INSERT/UPDATE must read NewValues so that an
            -- UPDATE which explicitly clears this column to NULL is treated as cleared
            -- (UNRESOLVED) rather than falling back to the pre-update OldValues.
            SELECT
                CASE

                    WHEN E.ChangeType =
                         ''DELETE''

                    THEN
                        JSON_VALUE
                        (
                            E.OldValues,
                            @JsonPathIn
                        )

                    ELSE
                        JSON_VALUE
                        (
                            E.NewValues,
                            @JsonPathIn
                        )

                END AS EntityValueRaw
        ) V;
        ';


        EXEC sys.sp_executesql
            @Sql,

            N'
                @EntityTypeIn VARCHAR(50),
                @JsonPathIn NVARCHAR(4000),
                @DetailIn NVARCHAR(500)
            ',

            @EntityTypeIn =
                @EntityType,

            @JsonPathIn =
                @JsonPath,

            @DetailIn =
                @Detail;


        RETURN;

    END;


    /*==============================================================
        PARENT
    ==============================================================*/

    IF @ResolverType = 'PARENT'
    BEGIN

        IF @SourceEntityColumn IS NULL
           OR @ParentSchema IS NULL
           OR @ParentTable IS NULL
           OR @ParentJoinColumn IS NULL
           OR @ParentEntityColumn IS NULL
        BEGIN

            UPDATE #Events

            SET
                EntityType =
                    @EntityType,

                EntityResolutionStatus =
                    'UNRESOLVED',

                EntityResolutionDetail =
                    'Incomplete PARENT resolver configuration.';

            RETURN;

        END;


        SET @JsonPath =
            N'$.'
            + @SourceEntityColumn;


        SET @Detail =
            CONCAT
            (
                @SourceSchema,
                '.',
                @SourceTable,
                '.',
                @SourceEntityColumn,

                ' -> ',

                @ParentSchema,
                '.',
                @ParentTable,
                '.',
                @ParentJoinColumn,

                ' -> ',

                @ParentEntityColumn
            );


        SET @Sql =
        N'
        UPDATE E

        SET
            EntityType =
                @EntityTypeIn,

            EntityId =
                TRY_CONVERT
                (
                    INT,
                    P.'
                    + QUOTENAME(@ParentEntityColumn)
                    + N'
                ),

            EntityResolutionStatus =
                CASE

                    WHEN P.'
                    + QUOTENAME(@ParentEntityColumn)
                    + N' IS NULL

                    THEN
                        ''UNRESOLVED''

                    ELSE
                        ''PARENT''

                END,

            EntityResolutionDetail =
                CASE

                    WHEN P.'
                    + QUOTENAME(@ParentEntityColumn)
                    + N' IS NULL

                    THEN
                        ''Parent entity not found.''

                    ELSE
                        @DetailIn

                END

        FROM #Events E

        CROSS APPLY
        (
            -- A DELETE only has OldValues; INSERT/UPDATE must read NewValues so that an
            -- UPDATE which explicitly clears this FK column to NULL is treated as cleared
            -- (UNRESOLVED) rather than falling back to the pre-update parent.
            SELECT
                CASE

                    WHEN E.ChangeType =
                         ''DELETE''

                    THEN
                        JSON_VALUE
                        (
                            E.OldValues,
                            @JsonPathIn
                        )

                    ELSE
                        JSON_VALUE
                        (
                            E.NewValues,
                            @JsonPathIn
                        )

                END AS EntityValueRaw
        ) V

        LEFT JOIN '
        + QUOTENAME(@ParentSchema)
        + N'.'
        + QUOTENAME(@ParentTable)
        + N' P

            ON P.'
            + QUOTENAME(@ParentJoinColumn)
            + N'
            =
            TRY_CONVERT
            (
                INT,
                V.EntityValueRaw
            );
        ';


        EXEC sys.sp_executesql
            @Sql,

            N'
                @EntityTypeIn VARCHAR(50),
                @JsonPathIn NVARCHAR(4000),
                @DetailIn NVARCHAR(500)
            ',

            @EntityTypeIn =
                @EntityType,

            @JsonPathIn =
                @JsonPath,

            @DetailIn =
                @Detail;


        RETURN;

    END;


    /*==============================================================
        CUSTOM
    ==============================================================*/

    IF @ResolverType = 'CUSTOM'
    BEGIN

        IF @CustomResolverProcedure IS NULL
        BEGIN

            UPDATE #Events

            SET
                EntityType =
                    @EntityType,

                EntityResolutionStatus =
                    'UNRESOLVED',

                EntityResolutionDetail =
                    'Custom resolver not configured.';

            RETURN;

        END;


        /*
            Basic protection:
            Only allow a normal schema.object procedure name.
        */

        IF PARSENAME(@CustomResolverProcedure, 1) IS NULL
           OR PARSENAME(@CustomResolverProcedure, 2) IS NULL
           OR PARSENAME(@CustomResolverProcedure, 3) IS NOT NULL
           OR PARSENAME(@CustomResolverProcedure, 4) IS NOT NULL
        BEGIN

            THROW
                51501,
                'Invalid custom resolver procedure name.',
                1;

        END;


        SET @Sql =
            N'
            EXEC '
            + QUOTENAME
              (
                  PARSENAME
                  (
                      @CustomResolverProcedure,
                      2
                  )
              )
            + N'.'
            + QUOTENAME
              (
                  PARSENAME
                  (
                      @CustomResolverProcedure,
                      1
                  )
              )
            + N'
                @DepartmentCode =
                    @DepartmentCodeIn,

                @SourceSchema =
                    @SourceSchemaIn,

                @SourceTable =
                    @SourceTableIn;
            ';


        EXEC sys.sp_executesql
            @Sql,

            N'
                @DepartmentCodeIn VARCHAR(20),
                @SourceSchemaIn VARCHAR(128),
                @SourceTableIn VARCHAR(128)
            ',

            @DepartmentCodeIn =
                @DepartmentCode,

            @SourceSchemaIn =
                @SourceSchema,

            @SourceTableIn =
                @SourceTable;


        UPDATE #Events

        SET
            EntityType =
                ISNULL
                (
                    EntityType,
                    @EntityType
                ),

            EntityResolutionStatus =
                'UNRESOLVED',

            EntityResolutionDetail =
                ISNULL
                (
                    EntityResolutionDetail,
                    'Custom resolver returned no entity.'
                )

        WHERE EntityId IS NULL;


        RETURN;

    END;

END;
GO

/*==============================================================================
    4. SP: PROCESS ONE CDC CAPTURE INSTANCE
==============================================================================*/

CREATE OR ALTER PROCEDURE CORE.usp_ProcessCdcCaptureInstance
(
    @CaptureInstance VARCHAR(200),
    @BatchSize INT = 20000
)
AS
BEGIN

    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @BatchSize <= 0
        THROW 52006, 'BatchSize must be greater than zero.', 1;


    DECLARE
        @DepartmentCode VARCHAR(20),

        @SourceSchema VARCHAR(128),
        @SourceTable VARCHAR(128),

        @ProcessingType VARCHAR(20),
        @CalculationType VARCHAR(20),

        @LastProcessedLsn BINARY(10),

        @MinLsn BINARY(10),
        @FromLsn BINARY(10),
        @ToLsn BINARY(10),
        @MaxAvailableLsn BINARY(10),
        @BatchBoundarySql NVARCHAR(MAX),

        @LogId BIGINT,
        @BatchId BIGINT,

        @FunctionName NVARCHAR(500),

        @Sql NVARCHAR(MAX),

        @ColumnListOld NVARCHAR(MAX),
        @ColumnListNew NVARCHAR(MAX),

        @RecordsRead INT = 0,
        @EventsCreated INT = 0;


    SELECT
        @DepartmentCode =
            DepartmentCode,

        @SourceSchema =
            SourceSchema,

        @SourceTable =
            SourceTable,

        @ProcessingType =
            ProcessingType,

        @CalculationType =
            CalculationType

    FROM CORE.CdcTableConfig

    WHERE CaptureInstance =
          @CaptureInstance

      AND IsActive =
          1;


    IF @SourceTable IS NULL
        THROW 52001,
              'CDC configuration missing.',
              1;


    IF NOT EXISTS
    (
        SELECT 1
        FROM cdc.change_tables
        WHERE capture_instance =
              @CaptureInstance
    )
        THROW 52002,
              'CDC capture instance missing.',
              1;


    SELECT
        @LastProcessedLsn =
            LastProcessedLsn

    FROM CORE.CdcProcessingCheckpoint

    WHERE CaptureInstance =
          @CaptureInstance

      AND IsActive =
          1;


    IF @LastProcessedLsn IS NULL
        THROW 52003,
              'CDC checkpoint missing.',
              1;


    SET @MinLsn =
        sys.fn_cdc_get_min_lsn
        (
            @CaptureInstance
        );


    SET @MaxAvailableLsn =
        sys.fn_cdc_get_max_lsn();


    IF @LastProcessedLsn <
       @MinLsn
    BEGIN

        THROW 52004,
              'CDC retention gap detected.',
              1;

    END;


    SET @FromLsn =
        sys.fn_cdc_increment_lsn
        (
            @LastProcessedLsn
        );


    IF @FromLsn >
       @MaxAvailableLsn
    BEGIN

        UPDATE CORE.CdcProcessingCheckpoint
        SET
            LastProcessedAt =
                SYSDATETIME(),
            LastError =
                NULL,
            LastErrorAt =
                NULL,
            UpdatedDate =
                GETDATE()
        WHERE CaptureInstance =
              @CaptureInstance;

        RETURN;

    END;


    SET @FunctionName =
        QUOTENAME('cdc')
        + '.'
        + QUOTENAME
          (
              'fn_cdc_get_all_changes_'
              + @CaptureInstance
          );

    IF @FunctionName IS NULL
        THROW 52005, 'Invalid capture instance name for CDC (CDC function name too long).', 1;


    /*
        Bound this run to at most @BatchSize changed rows instead of reading the whole
        [@FromLsn, @MaxAvailableLsn] window in one shot: an unbounded read on a large
        backlog (first run, or the job having fallen behind) would materialize the
        entire pending window into tempdb and hold one long-running transaction.
        @ToLsn is capped to the __$start_lsn of the last row of the batch so that all
        rows belonging to the same source commit are still processed together; the
        checkpoint is only advanced to that bounded @ToLsn, so any remaining backlog
        is picked up by the next scheduled invocation.
    */
    SET @BatchBoundarySql =
        N'
        SELECT TOP (1) @ToLsnOut = __$start_lsn
        FROM
        (
            SELECT TOP (@BatchSizeIn) __$start_lsn
            FROM '
            + @FunctionName
            + N'
            (
                @FromLsnIn,
                @MaxAvailableLsnIn,
                ''all''
            )
            ORDER BY __$start_lsn ASC, __$seqval ASC
        ) B
        ORDER BY __$start_lsn DESC;
        ';

    EXEC sys.sp_executesql
        @BatchBoundarySql,

        N'
            @FromLsnIn BINARY(10),
            @MaxAvailableLsnIn BINARY(10),
            @BatchSizeIn INT,
            @ToLsnOut BINARY(10) OUTPUT
        ',

        @FromLsnIn =
            @FromLsn,

        @MaxAvailableLsnIn =
            @MaxAvailableLsn,

        @BatchSizeIn =
            @BatchSize,

        @ToLsnOut =
            @ToLsn OUTPUT;

    IF @ToLsn IS NULL
        SET @ToLsn = @MaxAvailableLsn;


    INSERT INTO CORE.CdcProcessingLog
    (
        DepartmentCode,
        CaptureInstance,
        FromLsn,
        ToLsn,
        RecordsRead,
        EventsCreated,
        Status,
        StartedAt
    )
    VALUES
    (
        @DepartmentCode,
        @CaptureInstance,
        @FromLsn,
        @ToLsn,
        0,
        0,
        'IN_PROGRESS',
        SYSDATETIME()
    );


    SET @LogId =
        SCOPE_IDENTITY();


    SELECT
        @ColumnListOld =
            STRING_AGG
            (
                CAST
                (
                    'O.'
                    + QUOTENAME(C.name)
                    + ' AS '
                    + QUOTENAME(C.name)

                    AS NVARCHAR(MAX)
                ),
                ','
            ),

        @ColumnListNew =
            STRING_AGG
            (
                CAST
                (
                    'N.'
                    + QUOTENAME(C.name)
                    + ' AS '
                    + QUOTENAME(C.name)

                    AS NVARCHAR(MAX)
                ),
                ','
            )

    FROM sys.columns C

    WHERE C.object_id =
          OBJECT_ID
          (
              QUOTENAME(@SourceSchema)
              + '.'
              + QUOTENAME(@SourceTable)
          );


    CREATE TABLE #Events
    (
        EventRowId INT IDENTITY(1,1) NOT NULL,

        SourceRecordId INT NULL,

        ChangeType VARCHAR(20) NOT NULL,

        OldValues NVARCHAR(MAX) NULL,

        NewValues NVARCHAR(MAX) NULL,

        ChangedAt DATETIME2(3) NULL,

        CdcStartLsn BINARY(10) NOT NULL,

        CdcSeqVal BINARY(10) NOT NULL,

        CdcOperation TINYINT NOT NULL,

        EntityType VARCHAR(50) NULL,

        EntityId INT NULL,

        EntityResolutionStatus VARCHAR(20) NULL,

        EntityResolutionDetail NVARCHAR(500) NULL
    );


    BEGIN TRY

        BEGIN TRANSACTION;


        SET @Sql =
        N'
        SELECT *
        INTO #RawCdc

        FROM '
        + @FunctionName
        + N'
        (
            @FromLsn,
            @ToLsn,
            ''all update old''
        );


        INSERT INTO #Events
        (
            SourceRecordId,
            ChangeType,
            OldValues,
            NewValues,
            ChangedAt,
            CdcStartLsn,
            CdcSeqVal,
            CdcOperation
        )

        SELECT
            TRY_CONVERT
            (
                INT,
                N.Id
            ),

            ''UPDATE'',

            (
                SELECT
                    '
                    + @ColumnListOld
                    + N'
                FOR JSON PATH,
                    WITHOUT_ARRAY_WRAPPER,
                    INCLUDE_NULL_VALUES
            ),

            (
                SELECT
                    '
                    + @ColumnListNew
                    + N'
                FOR JSON PATH,
                    WITHOUT_ARRAY_WRAPPER,
                    INCLUDE_NULL_VALUES
            ),

            sys.fn_cdc_map_lsn_to_time
            (
                O.__$start_lsn
            ),

            O.__$start_lsn,

            O.__$seqval,

            4

        FROM #RawCdc O

        INNER JOIN #RawCdc N

            ON N.__$start_lsn =
               O.__$start_lsn

           AND N.__$seqval =
               O.__$seqval

           AND N.__$operation =
               4

        WHERE O.__$operation =
              3;


        INSERT INTO #Events
        (
            SourceRecordId,
            ChangeType,
            OldValues,
            NewValues,
            ChangedAt,
            CdcStartLsn,
            CdcSeqVal,
            CdcOperation
        )

        SELECT
            TRY_CONVERT
            (
                INT,
                N.Id
            ),

            ''INSERT'',

            NULL,

            (
                SELECT
                    '
                    + @ColumnListNew
                    + N'
                FOR JSON PATH,
                    WITHOUT_ARRAY_WRAPPER,
                    INCLUDE_NULL_VALUES
            ),

            sys.fn_cdc_map_lsn_to_time
            (
                N.__$start_lsn
            ),

            N.__$start_lsn,

            N.__$seqval,

            2

        FROM #RawCdc N

        WHERE N.__$operation =
              2;


        INSERT INTO #Events
        (
            SourceRecordId,
            ChangeType,
            OldValues,
            NewValues,
            ChangedAt,
            CdcStartLsn,
            CdcSeqVal,
            CdcOperation
        )

        SELECT
            TRY_CONVERT
            (
                INT,
                O.Id
            ),

            ''DELETE'',

            (
                SELECT
                    '
                    + @ColumnListOld
                    + N'
                FOR JSON PATH,
                    WITHOUT_ARRAY_WRAPPER,
                    INCLUDE_NULL_VALUES
            ),

            NULL,

            sys.fn_cdc_map_lsn_to_time
            (
                O.__$start_lsn
            ),

            O.__$start_lsn,

            O.__$seqval,

            1

        FROM #RawCdc O

        WHERE O.__$operation =
              1;


        SELECT
            @RecordsReadOut =
                COUNT(*)
        FROM #RawCdc;
        ';


        EXEC sys.sp_executesql
            @Sql,

            N'
                @FromLsn BINARY(10),
                @ToLsn BINARY(10),
                @RecordsReadOut INT OUTPUT
            ',

            @FromLsn =
                @FromLsn,

            @ToLsn =
                @ToLsn,

            @RecordsReadOut =
                @RecordsRead OUTPUT;



        /* ENTITY */

        IF @ProcessingType =
           'ENTITY'
        BEGIN

            EXEC CORE.usp_ResolveCdcEntityBatch

                @DepartmentCode =
                    @DepartmentCode,

                @SourceSchema =
                    @SourceSchema,

                @SourceTable =
                    @SourceTable;


            INSERT INTO CORE.EntityDataChangeEvent
            (
                DepartmentCode,

                EntityType,
                EntityId,

                SourceSchema,
                SourceTable,
                SourceRecordId,

                ChangeType,

                FieldChanges,

                EntityResolutionStatus,
                EntityResolutionDetail,

                ChangeSource,
                AttributionStatus,

                CreatedByUserId,
                UpdatedByUserId,
                ChangedByUserId,

                ChangedAt,

                CdcStartLsn,
                CdcSeqVal,
                CdcOperation,

                DetectionSource,

                ProcessedAt
            )

            SELECT
                @DepartmentCode,

                E.EntityType,

                E.EntityId,

                @SourceSchema,

                @SourceTable,

                E.SourceRecordId,

                E.ChangeType,

                CASE

                    WHEN E.ChangeType =
                         'UPDATE'

                    THEN
                        CORE.fn_GetChangedFields
                        (
                            E.OldValues,
                            E.NewValues
                        )

                    WHEN E.ChangeType =
                         'INSERT'

                    THEN
                        E.NewValues

                    ELSE
                        E.OldValues

                END,

                E.EntityResolutionStatus,

                E.EntityResolutionDetail,

                CASE

                    WHEN E.ChangeType =
                         'INSERT'

                         AND TRY_CONVERT
                             (
                                 INT,
                                 JSON_VALUE
                                 (
                                     E.NewValues,
                                     '$.CreatedBy'
                                 )
                             ) IS NOT NULL

                    THEN
                        'UI_API'


                    WHEN E.ChangeType =
                         'UPDATE'

                         AND
                         (
                             ISNULL
                             (
                                 JSON_VALUE
                                 (
                                     E.OldValues,
                                     '$.UpdatedDate'
                                 ),
                                 ''
                             )
                             <>
                             ISNULL
                             (
                                 JSON_VALUE
                                 (
                                     E.NewValues,
                                     '$.UpdatedDate'
                                 ),
                                 ''
                             )

                             OR

                             ISNULL
                             (
                                 JSON_VALUE
                                 (
                                     E.OldValues,
                                     '$.UpdatedBy'
                                 ),
                                 ''
                             )
                             <>
                             ISNULL
                             (
                                 JSON_VALUE
                                 (
                                     E.NewValues,
                                     '$.UpdatedBy'
                                 ),
                                 ''
                             )
                         )

                    THEN
                        'UI_API'


                    ELSE
                        'UNKNOWN'

                END,


                CASE

                    WHEN E.ChangeType =
                         'INSERT'

                    THEN
                        'CONFIRMED'


                    WHEN E.ChangeType =
                         'UPDATE'

                         AND
                         (
                             ISNULL
                             (
                                 JSON_VALUE
                                 (
                                     E.OldValues,
                                     '$.UpdatedDate'
                                 ),
                                 ''
                             )
                             <>
                             ISNULL
                             (
                                 JSON_VALUE
                                 (
                                     E.NewValues,
                                     '$.UpdatedDate'
                                 ),
                                 ''
                             )

                             OR

                             ISNULL
                             (
                                 JSON_VALUE
                                 (
                                     E.OldValues,
                                     '$.UpdatedBy'
                                 ),
                                 ''
                             )
                             <>
                             ISNULL
                             (
                                 JSON_VALUE
                                 (
                                     E.NewValues,
                                     '$.UpdatedBy'
                                 ),
                                 ''
                             )
                         )

                    THEN
                        'CONFIRMED'


                    ELSE
                        'NOT_FOUND'

                END,


                TRY_CONVERT
                (
                    INT,
                    COALESCE
                    (
                        JSON_VALUE
                        (
                            E.NewValues,
                            '$.CreatedBy'
                        ),

                        JSON_VALUE
                        (
                            E.OldValues,
                            '$.CreatedBy'
                        )
                    )
                ),


                TRY_CONVERT
                (
                    INT,
                    COALESCE
                    (
                        JSON_VALUE
                        (
                            E.NewValues,
                            '$.UpdatedBy'
                        ),

                        JSON_VALUE
                        (
                            E.OldValues,
                            '$.UpdatedBy'
                        )
                    )
                ),


                CASE

                    WHEN E.ChangeType =
                         'INSERT'

                    THEN
                        TRY_CONVERT
                        (
                            INT,
                            JSON_VALUE
                            (
                                E.NewValues,
                                '$.CreatedBy'
                            )
                        )

                    WHEN E.ChangeType =
                         'UPDATE'

                    THEN
                        TRY_CONVERT
                        (
                            INT,
                            JSON_VALUE
                            (
                                E.NewValues,
                                '$.UpdatedBy'
                            )
                        )

                    ELSE
                        NULL

                END,


                E.ChangedAt,

                E.CdcStartLsn,

                E.CdcSeqVal,

                E.CdcOperation,

                'CDC',

                SYSDATETIME()


            FROM #Events E

            WHERE
            (
                E.ChangeType <>
                'UPDATE'

                OR

                CORE.fn_GetChangedFields
                (
                    E.OldValues,
                    E.NewValues
                ) <> N'[]'
            )

            AND NOT EXISTS
            (
                SELECT 1

                FROM CORE.EntityDataChangeEvent X

                WHERE X.SourceSchema =
                      @SourceSchema

                  AND X.SourceTable =
                      @SourceTable

                  AND ISNULL
                      (
                          X.SourceRecordId,
                          -1
                      )
                      =
                      ISNULL
                      (
                          E.SourceRecordId,
                          -1
                      )

                  AND X.CdcStartLsn =
                      E.CdcStartLsn

                  AND X.CdcSeqVal =
                      E.CdcSeqVal

                  AND X.ChangeType =
                      E.ChangeType
            );


            SET @EventsCreated =
                @@ROWCOUNT;

        END;


        /* MASTER */

        ELSE IF @ProcessingType IN
        (
            'MASTER',
            'AUDIT'
        )
        BEGIN

            DELETE FROM #Events

            WHERE ChangeType =
                  'UPDATE'

              AND CORE.fn_GetChangedFields
                  (
                      OldValues,
                      NewValues
                  ) = N'[]';


            IF EXISTS
            (
                SELECT 1
                FROM #Events
            )
            BEGIN

                INSERT INTO CORE.MasterDataChangeBatch
                (
                    DepartmentCode,

                    SourceSchema,

                    SourceTable,

                    CalculationType,

                    Status,

                    RemarkSummary,

                    TotalRecords,

                    ProcessedRecords,

                    CreatedAt,

                    CdcStartLsn,

                    IsActive
                )

                SELECT
                    @DepartmentCode,

                    @SourceSchema,

                    @SourceTable,

                    @CalculationType,

                    CASE
                        WHEN @ProcessingType =
                             'AUDIT'
                        THEN
                            'COMPLETED'
                        ELSE
                            'PENDING'
                    END,

                    'CDC data change detected.',

                    COUNT(*),

                    CASE
                        WHEN @ProcessingType =
                             'AUDIT'
                        THEN COUNT(*)
                        ELSE 0
                    END,

                    SYSDATETIME(),

                    MIN(CdcStartLsn),

                    1

                FROM #Events;


                SET @BatchId =
                    SCOPE_IDENTITY();


                INSERT INTO CORE.MasterDataChangeEvent
                (
                    BatchId,

                    DepartmentCode,

                    SourceSchema,

                    SourceTable,

                    SourceRecordId,

                    ChangeType,

                    FieldChanges,

                    ChangeSource,

                    AttributionStatus,

                    CreatedByUserId,

                    UpdatedByUserId,

                    ChangedByUserId,

                    ChangedAt,

                    CdcStartLsn,

                    CdcSeqVal,

                    CdcOperation,

                    DetectionSource,

                    ProcessedAt
                )

                SELECT
                    @BatchId,

                    @DepartmentCode,

                    @SourceSchema,

                    @SourceTable,

                    E.SourceRecordId,

                    E.ChangeType,

                    CASE
                        WHEN E.ChangeType =
                             'UPDATE'
                        THEN
                            CORE.fn_GetChangedFields
                            (
                                E.OldValues,
                                E.NewValues
                            )

                        WHEN E.ChangeType =
                             'INSERT'
                        THEN
                            E.NewValues

                        ELSE
                            E.OldValues
                    END,

                    CASE
                        WHEN E.ChangeType =
                             'UPDATE'

                             AND
                             (
                                 ISNULL
                                 (
                                     JSON_VALUE
                                     (
                                         E.OldValues,
                                         '$.UpdatedDate'
                                     ),
                                     ''
                                 )
                                 <>
                                 ISNULL
                                 (
                                     JSON_VALUE
                                     (
                                         E.NewValues,
                                         '$.UpdatedDate'
                                     ),
                                     ''
                                 )

                                 OR

                                 ISNULL
                                 (
                                     JSON_VALUE
                                     (
                                         E.OldValues,
                                         '$.UpdatedBy'
                                     ),
                                     ''
                                 )
                                 <>
                                 ISNULL
                                 (
                                     JSON_VALUE
                                     (
                                         E.NewValues,
                                         '$.UpdatedBy'
                                     ),
                                     ''
                                 )
                             )

                        THEN 'UI_API'

                        ELSE 'UNKNOWN'
                    END,

                    'NOT_FOUND',

                    TRY_CONVERT
                    (
                        INT,
                        COALESCE
                        (
                            JSON_VALUE
                            (
                                E.NewValues,
                                '$.CreatedBy'
                            ),
                            JSON_VALUE
                            (
                                E.OldValues,
                                '$.CreatedBy'
                            )
                        )
                    ),

                    TRY_CONVERT
                    (
                        INT,
                        COALESCE
                        (
                            JSON_VALUE
                            (
                                E.NewValues,
                                '$.UpdatedBy'
                            ),
                            JSON_VALUE
                            (
                                E.OldValues,
                                '$.UpdatedBy'
                            )
                        )
                    ),

                    NULL,

                    E.ChangedAt,

                    E.CdcStartLsn,

                    E.CdcSeqVal,

                    E.CdcOperation,

                    'CDC',

                    SYSDATETIME()

                FROM #Events E

                WHERE NOT EXISTS
                (
                    SELECT 1

                    FROM CORE.MasterDataChangeEvent X

                    WHERE X.SourceSchema =
                          @SourceSchema

                      AND X.SourceTable =
                          @SourceTable

                      AND ISNULL
                          (
                              X.SourceRecordId,
                              -1
                          )
                          =
                          ISNULL
                          (
                              E.SourceRecordId,
                              -1
                          )

                      AND X.CdcStartLsn =
                          E.CdcStartLsn

                      AND X.CdcSeqVal =
                          E.CdcSeqVal

                      AND X.ChangeType =
                          E.ChangeType
                );


                SET @EventsCreated =
                    @@ROWCOUNT;


                IF @EventsCreated = 0
                BEGIN

                    DELETE FROM
                        CORE.MasterDataChangeBatch

                    WHERE Id =
                          @BatchId;

                END;

            END;

        END;


        UPDATE CORE.CdcProcessingCheckpoint

        SET
            LastProcessedLsn =
                @ToLsn,

            LastProcessedAt =
                SYSDATETIME(),

            LastError =
                NULL,

            LastErrorAt =
                NULL,

            UpdatedDate =
                GETDATE()

        WHERE CaptureInstance =
              @CaptureInstance;


        COMMIT TRANSACTION;


        UPDATE CORE.CdcProcessingLog

        SET
            RecordsRead =
                @RecordsRead,

            EventsCreated =
                @EventsCreated,

            Status =
                'COMPLETED',

            CompletedAt =
                SYSDATETIME(),

            ErrorDetail =
                NULL

        WHERE Id =
              @LogId;


    END TRY

    BEGIN CATCH


        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;


        DECLARE @ErrorMessage NVARCHAR(MAX) =
            CONCAT
            (
                'Error ',
                ERROR_NUMBER(),
                ', Line ',
                ERROR_LINE(),
                ': ',
                ERROR_MESSAGE()
            );


        UPDATE CORE.CdcProcessingLog

        SET
            Status =
                'FAILED',

            CompletedAt =
                SYSDATETIME(),

            ErrorDetail =
                @ErrorMessage

        WHERE Id =
              @LogId;


        UPDATE CORE.CdcProcessingCheckpoint

        SET
            LastError =
                @ErrorMessage,

            LastErrorAt =
                SYSDATETIME(),

            UpdatedDate =
                GETDATE()

        WHERE CaptureInstance =
              @CaptureInstance;


        THROW;

    END CATCH;

END;
GO



/*==============================================================================
    5. SP: PROCESS CDC BY DEPARTMENT / TYPE
==============================================================================*/

CREATE OR ALTER PROCEDURE CORE.usp_ProcessCdcChanges
(
    @DepartmentCode VARCHAR(20) = NULL,

    @ProcessingType VARCHAR(20) =
        'ALL'
)
AS
BEGIN

    SET NOCOUNT ON;


    DECLARE
        @CaptureInstance VARCHAR(200),

        @LockResult INT,

        @FailureCount INT = 0,
        @InstanceCount INT = 0,
        @FirstFailureInstance VARCHAR(200) = NULL,
        @FirstFailureMessage NVARCHAR(2000) = NULL,
        @AggregateErrorMessage NVARCHAR(2048);


    SET @ProcessingType =
        UPPER
        (
            LTRIM
            (
                RTRIM(@ProcessingType)
            )
        );


    IF @DepartmentCode IS NOT NULL
    BEGIN

        SET @DepartmentCode =
            UPPER
            (
                LTRIM
                (
                    RTRIM(@DepartmentCode)
                )
            );

    END;


    IF @ProcessingType NOT IN
    (
        'ALL',
        'ENTITY',
        'MASTER',
        'AUDIT'
    )
    BEGIN

        THROW
            53001,
            'Invalid ProcessingType.',
            1;

    END;


    EXEC @LockResult =
        sys.sp_getapplock

        @Resource =
            'CORE_CDC_PROCESSOR',

        @LockMode =
            'Exclusive',

        @LockOwner =
            'Session',

        @LockTimeout =
            0;


    IF @LockResult < 0
    BEGIN

        PRINT
            'CDC processor already running.';

        RETURN;

    END;


    BEGIN TRY


        DECLARE CdcCursor CURSOR
            LOCAL FAST_FORWARD

        FOR

        SELECT
            CaptureInstance

        FROM CORE.CdcTableConfig

        WHERE IsActive =
              1

          AND
          (
              @DepartmentCode IS NULL

              OR DepartmentCode =
                 @DepartmentCode
          )

          AND
          (
              @ProcessingType =
              'ALL'

              OR ProcessingType =
                 @ProcessingType
          )

        ORDER BY
            DepartmentCode,
            Id;


        OPEN CdcCursor;


        FETCH NEXT
        FROM CdcCursor
        INTO @CaptureInstance;


        WHILE @@FETCH_STATUS = 0
        BEGIN

            SET @InstanceCount =
                @InstanceCount + 1;


            BEGIN TRY

                EXEC CORE.usp_ProcessCdcCaptureInstance

                    @CaptureInstance =
                        @CaptureInstance;

            END TRY

            BEGIN CATCH

                SET @FailureCount =
                    @FailureCount + 1;

                IF @FirstFailureInstance IS NULL
                BEGIN

                    SET @FirstFailureInstance =
                        @CaptureInstance;

                    SET @FirstFailureMessage =
                        ERROR_MESSAGE();

                END;

                PRINT
                    CONCAT
                    (
                        'CDC processing failed: ',
                        @CaptureInstance,
                        ' - ',
                        ERROR_MESSAGE()
                    );

            END CATCH;


            FETCH NEXT
            FROM CdcCursor
            INTO @CaptureInstance;

        END;


        CLOSE CdcCursor;

        DEALLOCATE CdcCursor;


        EXEC sys.sp_releaseapplock

            @Resource =
                'CORE_CDC_PROCESSOR',

            @LockOwner =
                'Session';


    END TRY

    BEGIN CATCH


        IF CURSOR_STATUS
        (
            'local',
            'CdcCursor'
        ) >= 0
        BEGIN

            CLOSE CdcCursor;

            DEALLOCATE CdcCursor;

        END;


        EXEC sys.sp_releaseapplock

            @Resource =
                'CORE_CDC_PROCESSOR',

            @LockOwner =
                'Session';


        THROW;

    END CATCH;


    /*
        Individual capture-instance failures are caught above (per row of the cursor)
        so that one bad table doesn't stop the rest from being processed; each one is
        already persisted to CORE.CdcProcessingCheckpoint/CdcProcessingLog. Once the
        lock is released and the loop has finished, surface an aggregate failure here
        so a scheduler/caller can tell a run with failures apart from a clean one.
    */
    IF @FailureCount > 0
    BEGIN

        SET @AggregateErrorMessage =
            CONCAT
            (
                @FailureCount,
                ' of ',
                @InstanceCount,
                ' CDC capture instance(s) failed. First failure: ',
                @FirstFailureInstance,
                ' - ',
                @FirstFailureMessage
            );

        THROW
            53002,
            @AggregateErrorMessage,
            1;

    END;

END;
GO



/*==============================================================================
    6. SP: PROCESS ONE SOURCE TABLE
==============================================================================*/

CREATE OR ALTER PROCEDURE CORE.usp_ProcessSingleCdcTable
(
    @SourceSchema VARCHAR(128),

    @SourceTable VARCHAR(128)
)
AS
BEGIN

    SET NOCOUNT ON;


    DECLARE
        @CaptureInstance VARCHAR(200);


    SELECT
        @CaptureInstance =
            CaptureInstance

    FROM CORE.CdcTableConfig

    WHERE SourceSchema =
          @SourceSchema

      AND SourceTable =
          @SourceTable

      AND IsActive =
          1;


    IF @CaptureInstance IS NULL
    BEGIN

        THROW
            54001,
            'Active CDC table configuration not found.',
            1;

    END;


    EXEC CORE.usp_ProcessCdcCaptureInstance

        @CaptureInstance =
            @CaptureInstance;

END;
GO



/*==============================================================================
    7. SP: SQL AUDIT ENRICHMENT
==============================================================================*/

CREATE OR ALTER PROCEDURE CORE.usp_EnrichCdcEventsFromSqlAudit
(
    @DepartmentCode VARCHAR(20) = NULL,

    @ProcessingType VARCHAR(20) =
        'ALL',

    @AuditFilePath NVARCHAR(4000) =
        N'D:\SQLAudit\NTIS\*.sqlaudit',

    @WindowSeconds INT =
        5,

    @BatchSize INT =
        5000,

    @LocalTimeZoneName SYSNAME =
        N'India Standard Time'
)
AS
BEGIN

    SET NOCOUNT ON;


    SET @ProcessingType =
        UPPER
        (
            LTRIM
            (
                RTRIM(@ProcessingType)
            )
        );


    IF @DepartmentCode IS NOT NULL
    BEGIN

        SET @DepartmentCode =
            UPPER
            (
                LTRIM
                (
                    RTRIM(@DepartmentCode)
                )
            );

    END;


    CREATE TABLE #Audit
    (
        AuditRowId BIGINT
            IDENTITY(1,1),

        AuditEventTime DATETIME2(3),

        OperationType VARCHAR(10),

        SqlLogin NVARCHAR(256),

        DatabaseUser NVARCHAR(256),

        DatabaseName SYSNAME,

        SchemaName SYSNAME,

        ObjectName SYSNAME,

        ApplicationName NVARCHAR(256),

        ClientIp VARCHAR(64),

        SqlStatement NVARCHAR(MAX)
    );


    INSERT INTO #Audit
    (
        AuditEventTime,

        OperationType,

        SqlLogin,

        DatabaseUser,

        DatabaseName,

        SchemaName,

        ObjectName,

        ApplicationName,

        ClientIp,

        SqlStatement
    )

    SELECT
        CAST
        (
            AF.event_time
                AT TIME ZONE 'UTC'
                AT TIME ZONE @LocalTimeZoneName

            AS DATETIME2(3)
        ),

        CASE AF.action_id
            WHEN 'IN'
                THEN 'INSERT'
            WHEN 'UP'
                THEN 'UPDATE'
            WHEN 'DL'
                THEN 'DELETE'
        END,

        AF.session_server_principal_name,

        AF.database_principal_name,

        AF.database_name,

        AF.schema_name,

        AF.object_name,

        AF.application_name,

        AF.client_ip,

        AF.statement

    FROM sys.fn_get_audit_file
    (
        @AuditFilePath,
        DEFAULT,
        DEFAULT
    ) AF

    WHERE AF.database_name =
          DB_NAME()

      AND AF.action_id IN
      (
          'IN',
          'UP',
          'DL'
      );


    CREATE INDEX IX_AuditLookup

    ON #Audit
    (
        SchemaName,
        ObjectName,
        OperationType,
        AuditEventTime
    );


    /* ENTITY */

    IF @ProcessingType IN
    (
        'ALL',
        'ENTITY'
    )
    BEGIN

        ;WITH Candidate AS
        (
            SELECT
                E.Id AS EventId,

                A.AuditRowId,

                COUNT(*)
                OVER
                (
                    PARTITION BY E.Id
                )
                AS CandidateCount,

                ROW_NUMBER()
                OVER
                (
                    PARTITION BY E.Id

                    ORDER BY
                        ABS
                        (
                            DATEDIFF_BIG
                            (
                                MILLISECOND,
                                E.ChangedAt,
                                A.AuditEventTime
                            )
                        )
                )
                AS CandidateRank

            FROM
            (
                SELECT TOP (@BatchSize)
                    *
                FROM CORE.EntityDataChangeEvent
                WHERE ChangeSource =
                      'UNKNOWN'

                  AND
                  (
                      @DepartmentCode IS NULL

                      OR DepartmentCode =
                         @DepartmentCode
                  )

                ORDER BY Id
            ) E

            JOIN #Audit A
                ON A.SchemaName =
                   E.SourceSchema

               AND A.ObjectName =
                   E.SourceTable

               AND A.OperationType =
                   E.ChangeType

               AND A.AuditEventTime
                   BETWEEN
                   DATEADD
                   (
                       SECOND,
                       -@WindowSeconds,
                       E.ChangedAt
                   )
                   AND
                   DATEADD
                   (
                       SECOND,
                       @WindowSeconds,
                       E.ChangedAt
                   )
        )

        UPDATE E

        SET
            ChangeSource =
                'DIRECT_SQL',

            AttributionStatus =
                'MATCHED',

            ChangedByUserId =
                NULL,

            ChangedBySqlLogin =
                A.SqlLogin,

            DatabaseUser =
                A.DatabaseUser,

            ApplicationName =
                A.ApplicationName,

            ClientIp =
                A.ClientIp,

            SqlStatement =
                A.SqlStatement,

            AuditEventTime =
                A.AuditEventTime

        FROM CORE.EntityDataChangeEvent E

        JOIN Candidate C
            ON C.EventId =
               E.Id

           AND C.CandidateCount =
               1

           AND C.CandidateRank =
               1

        JOIN #Audit A
            ON A.AuditRowId =
               C.AuditRowId;


        ;WITH Ambiguous AS
        (
            SELECT
                E.Id
            FROM CORE.EntityDataChangeEvent E
            JOIN #Audit A
                ON A.SchemaName =
                   E.SourceSchema
               AND A.ObjectName =
                   E.SourceTable
               AND A.OperationType =
                   E.ChangeType
               AND A.AuditEventTime
                   BETWEEN
                   DATEADD
                   (
                       SECOND,
                       -@WindowSeconds,
                       E.ChangedAt
                   )
                   AND
                   DATEADD
                   (
                       SECOND,
                       @WindowSeconds,
                       E.ChangedAt
                   )
            WHERE E.ChangeSource =
                  'UNKNOWN'

              AND
              (
                  @DepartmentCode IS NULL

                  OR E.DepartmentCode =
                     @DepartmentCode
              )

            GROUP BY E.Id

            HAVING COUNT(*) > 1
        )

        UPDATE E
        SET
            AttributionStatus =
                'AMBIGUOUS'

        FROM CORE.EntityDataChangeEvent E

        JOIN Ambiguous A
            ON A.Id =
               E.Id;

    END;


    /* MASTER */

    IF @ProcessingType IN
    (
        'ALL',
        'MASTER'
    )
    BEGIN

        ;WITH Candidate AS
        (
            SELECT
                E.Id AS EventId,

                A.AuditRowId,

                COUNT(*)
                OVER
                (
                    PARTITION BY E.Id
                )
                AS CandidateCount,

                ROW_NUMBER()
                OVER
                (
                    PARTITION BY E.Id

                    ORDER BY
                        ABS
                        (
                            DATEDIFF_BIG
                            (
                                MILLISECOND,
                                E.ChangedAt,
                                A.AuditEventTime
                            )
                        )
                )
                AS CandidateRank

            FROM
            (
                SELECT TOP (@BatchSize)
                    *
                FROM CORE.MasterDataChangeEvent
                WHERE ChangeSource =
                      'UNKNOWN'

                  AND
                  (
                      @DepartmentCode IS NULL

                      OR DepartmentCode =
                         @DepartmentCode
                  )

                ORDER BY Id
            ) E

            JOIN #Audit A
                ON A.SchemaName =
                   E.SourceSchema

               AND A.ObjectName =
                   E.SourceTable

               AND A.OperationType =
                   E.ChangeType

               AND A.AuditEventTime
                   BETWEEN
                   DATEADD
                   (
                       SECOND,
                       -@WindowSeconds,
                       E.ChangedAt
                   )

                   AND

                   DATEADD
                   (
                       SECOND,
                       @WindowSeconds,
                       E.ChangedAt
                   )
        )

        UPDATE E
        SET
            ChangeSource =
                'DIRECT_SQL',

            AttributionStatus =
                'MATCHED',

            ChangedByUserId =
                NULL,

            ChangedBySqlLogin =
                A.SqlLogin,

            DatabaseUser =
                A.DatabaseUser,

            ApplicationName =
                A.ApplicationName,

            ClientIp =
                A.ClientIp,

            SqlStatement =
                A.SqlStatement,

            AuditEventTime =
                A.AuditEventTime

        FROM CORE.MasterDataChangeEvent E

        JOIN Candidate C
            ON C.EventId =
               E.Id

           AND C.CandidateCount =
               1

           AND C.CandidateRank =
               1

        JOIN #Audit A
            ON A.AuditRowId =
               C.AuditRowId;

    END;

END;
GO



/*==============================================================================
    8. SP: STATUS
==============================================================================*/

CREATE OR ALTER PROCEDURE CORE.usp_GetCdcProcessorStatus
(
    @DepartmentCode VARCHAR(20) = NULL
)
AS
BEGIN

    SET NOCOUNT ON;


    SELECT
        C.Id,

        C.DepartmentCode,

        C.CaptureInstance,

        C.SourceSchema,

        C.SourceTable,

        C.ProcessingType,

        C.EntityType,

        C.CalculationType,

        C.TriggersRecalculation,


        CASE
            WHEN CT.capture_instance IS NULL
                THEN 'NO'
            ELSE
                'YES'
        END AS CdcEnabled,


        CP.LastProcessedLsn,

        CP.LastProcessedAt,

        CP.LastError,

        CP.LastErrorAt,


        CASE

            WHEN CT.capture_instance IS NULL
            THEN
                'CDC_MISSING'

            WHEN CP.CaptureInstance IS NULL
                 OR CP.LastProcessedLsn IS NULL
            THEN
                'CHECKPOINT_MISSING'

            WHEN CP.LastProcessedLsn <
                 sys.fn_cdc_get_min_lsn
                 (
                     C.CaptureInstance
                 )
            THEN
                'RETENTION_GAP'

            WHEN CP.LastError IS NOT NULL
            THEN
                'ERROR'

            ELSE
                'READY'

        END AS ProcessorStatus

    FROM CORE.CdcTableConfig C

    LEFT JOIN cdc.change_tables CT
        ON CT.capture_instance =
           C.CaptureInstance

    LEFT JOIN CORE.CdcProcessingCheckpoint CP
        ON CP.CaptureInstance =
           C.CaptureInstance

    WHERE C.IsActive =
          1

      AND
      (
          @DepartmentCode IS NULL

          OR C.DepartmentCode =
             @DepartmentCode
      )

    ORDER BY
        C.DepartmentCode,
        C.ProcessingType,
        C.SourceTable;

END;
GO



/*==============================================================================
    EXAMPLE EXECUTION
==============================================================================*/


/* MASTER */

-- EXEC CORE.usp_ProcessCdcChanges
--     @DepartmentCode = 'PTIS',
--     @ProcessingType = 'MASTER';


/* ENTITY */

-- EXEC CORE.usp_ProcessCdcChanges
--     @DepartmentCode = 'PTIS',
--     @ProcessingType = 'ENTITY';


/* ALL */

-- EXEC CORE.usp_ProcessCdcChanges
--     @DepartmentCode = NULL,
--     @ProcessingType = 'ALL';


/* SQL AUDIT ENRICHMENT */

-- EXEC CORE.usp_EnrichCdcEventsFromSqlAudit
--     @DepartmentCode = 'PTIS',
--     @ProcessingType = 'ALL',
--     @AuditFilePath =
--         N'D:\SQLAudit\NTIS\*.sqlaudit',
--     @WindowSeconds = 5,
--     @LocalTimeZoneName =
--         N'India Standard Time';


/* STATUS */

-- EXEC CORE.usp_GetCdcProcessorStatus
--     @DepartmentCode = 'PTIS';

GO

















----------------------------------------------------------

/*==============================================================================
    CDC POST-DEPLOYMENT INITIALIZATION
    Uses existing CORE.CdcTableConfig seed data.

    Rules:
      1. Enable database CDC if required.
      2. Read active config rows dynamically.
      3. If a capture instance is newly created, create/reinitialize its checkpoint.
      4. If capture instance already existed, preserve its checkpoint LSN.
      5. Never silently repair a retention gap on an existing production CDC instance.
==============================================================================*/

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

/*==============================================================================
    1. ENABLE CDC ON DATABASE
==============================================================================*/
IF (SELECT is_cdc_enabled FROM sys.databases WHERE database_id = DB_ID()) = 0
BEGIN
    BEGIN TRY
        PRINT 'Enabling database CDC...';
        EXEC sys.sp_cdc_enable_db;
        PRINT 'Database CDC enabled successfully.';
    END TRY
    BEGIN CATCH
        PRINT CONCAT('Database CDC could not be enabled (e.g. Express Edition / LocalDB): ', ERROR_MESSAGE());
    END CATCH
END
ELSE
BEGIN
    PRINT 'Database CDC already enabled.';
END;
GO

/*==============================================================================
    2. ENABLE CDC + INITIALIZE CHECKPOINTS FOR ACTIVE CONFIG ROWS
==============================================================================*/
IF (SELECT is_cdc_enabled FROM sys.databases WHERE database_id = DB_ID()) = 1
BEGIN
DECLARE
    @ConfigId INT,
    @DepartmentCode VARCHAR(20),
    @SourceSchema VARCHAR(128),
    @SourceTable VARCHAR(128),
    @CaptureInstance VARCHAR(200),
    @CdcWasAlreadyEnabled BIT,
    @MinAvailableLsn BINARY(10),
    @CurrentMaxLsn BINARY(10),
    @ExistingCheckpointLsn BINARY(10);

DECLARE CdcEnableCursor CURSOR LOCAL FAST_FORWARD FOR
SELECT
    C.Id,
    C.DepartmentCode,
    C.SourceSchema,
    C.SourceTable,
    C.CaptureInstance
FROM CORE.CdcTableConfig C
WHERE C.IsActive = 1
ORDER BY C.DepartmentCode, C.Id;

OPEN CdcEnableCursor;

FETCH NEXT FROM CdcEnableCursor
INTO @ConfigId, @DepartmentCode, @SourceSchema, @SourceTable, @CaptureInstance;

WHILE @@FETCH_STATUS = 0
BEGIN
    BEGIN TRY
        IF OBJECT_ID(QUOTENAME(@SourceSchema) + '.' + QUOTENAME(@SourceTable), 'U') IS NULL
        BEGIN
            PRINT CONCAT('SKIPPED - TABLE NOT FOUND: ', @SourceSchema, '.', @SourceTable);
        END
        ELSE
        BEGIN
            SET @CdcWasAlreadyEnabled = CASE WHEN EXISTS
            (
                SELECT 1
                FROM cdc.change_tables
                WHERE capture_instance = @CaptureInstance
            ) THEN 1 ELSE 0 END;

            IF @CdcWasAlreadyEnabled = 0
            BEGIN
                PRINT CONCAT('Enabling CDC: ', @SourceSchema, '.', @SourceTable, ' -> ', @CaptureInstance);

                EXEC sys.sp_cdc_enable_table
                    @source_schema = @SourceSchema,
                    @source_name = @SourceTable,
                    @role_name = NULL,
                    @capture_instance = @CaptureInstance,
                    @supports_net_changes = 0;

                PRINT CONCAT('CDC CREATED: ', @CaptureInstance);
            END
            ELSE
            BEGIN
                PRINT CONCAT('CDC ALREADY ENABLED: ', @CaptureInstance);
            END;

            IF NOT EXISTS
            (
                SELECT 1
                FROM cdc.change_tables
                WHERE capture_instance = @CaptureInstance
            )
            BEGIN
                THROW 55001, 'CDC capture instance was not created.', 1;
            END;

            SET @CurrentMaxLsn = sys.fn_cdc_get_max_lsn();
            SET @MinAvailableLsn = sys.fn_cdc_get_min_lsn(@CaptureInstance);
            SET @ExistingCheckpointLsn = NULL;

            SELECT @ExistingCheckpointLsn = LastProcessedLsn
            FROM CORE.CdcProcessingCheckpoint
            WHERE CaptureInstance = @CaptureInstance;

            IF @ExistingCheckpointLsn IS NULL
               AND NOT EXISTS
               (
                   SELECT 1
                   FROM CORE.CdcProcessingCheckpoint
                   WHERE CaptureInstance = @CaptureInstance
               )
            BEGIN
                INSERT INTO CORE.CdcProcessingCheckpoint
                (
                    CaptureInstance, SourceSchema, SourceTable,
                    LastProcessedLsn, LastProcessedAt,
                    LastError, LastErrorAt, IsActive, CreatedDate
                )
                VALUES
                (
                    @CaptureInstance, @SourceSchema, @SourceTable,
                    @CurrentMaxLsn, SYSDATETIME(),
                    NULL, NULL, 1, GETDATE()
                );

                PRINT CONCAT('CHECKPOINT CREATED: ', @CaptureInstance);
            END
            ELSE IF @CdcWasAlreadyEnabled = 0
            BEGIN
                /* New/recreated CDC lifecycle: any prior checkpoint is not valid for it. */
                UPDATE CORE.CdcProcessingCheckpoint
                SET SourceSchema = @SourceSchema,
                    SourceTable = @SourceTable,
                    LastProcessedLsn = @CurrentMaxLsn,
                    LastProcessedAt = SYSDATETIME(),
                    LastError = NULL,
                    LastErrorAt = NULL,
                    IsActive = 1,
                    UpdatedDate = GETDATE()
                WHERE CaptureInstance = @CaptureInstance;

                PRINT CONCAT('CHECKPOINT REINITIALIZED: ', @CaptureInstance);
            END
            ELSE
            BEGIN
                /* Existing production CDC lifecycle: retain LSN. */
                UPDATE CORE.CdcProcessingCheckpoint
                SET SourceSchema = @SourceSchema,
                    SourceTable = @SourceTable,
                    IsActive = 1,
                    UpdatedDate = GETDATE()
                WHERE CaptureInstance = @CaptureInstance;

                IF @ExistingCheckpointLsn IS NULL
                BEGIN
                    PRINT CONCAT('WARNING - CHECKPOINT LSN NULL: ', @CaptureInstance);
                END
                ELSE IF @MinAvailableLsn IS NOT NULL AND @ExistingCheckpointLsn < @MinAvailableLsn
                BEGIN
                    PRINT CONCAT('WARNING - RETENTION GAP NOT AUTO-RESET: ', @CaptureInstance);
                END
                ELSE
                BEGIN
                    PRINT CONCAT('CHECKPOINT RETAINED: ', @CaptureInstance);
                END;
            END;
        END;
    END TRY
    BEGIN CATCH
        PRINT CONCAT('FAILED: ', ISNULL(@CaptureInstance, '<NULL>'), ' - ', ERROR_MESSAGE());
    END CATCH;

    FETCH NEXT FROM CdcEnableCursor
    INTO @ConfigId, @DepartmentCode, @SourceSchema, @SourceTable, @CaptureInstance;
END;

CLOSE CdcEnableCursor;
DEALLOCATE CdcEnableCursor;
END;
GO

-- /*==============================================================================
--     3. START CDC JOBS
-- ==============================================================================*/
-- BEGIN TRY
--     EXEC sys.sp_cdc_start_job @job_type = N'capture';
--     PRINT 'CDC capture job start requested.';
-- END TRY
-- BEGIN CATCH
--     PRINT CONCAT('CDC capture job start: ', ERROR_MESSAGE());
-- END CATCH;
-- GO

-- BEGIN TRY
--     EXEC sys.sp_cdc_start_job @job_type = N'cleanup';
--     PRINT 'CDC cleanup job start requested.';
-- END TRY
-- BEGIN CATCH
--     PRINT CONCAT('CDC cleanup job start: ', ERROR_MESSAGE());
-- END CATCH;
-- GO

-- /*==============================================================================
--     4. SET CDC CLEANUP RETENTION TO 7 DAYS
-- ==============================================================================*/
-- BEGIN TRY
--     EXEC sys.sp_cdc_change_job
--         @job_type = N'cleanup',
--         @retention = 10080;
--     PRINT 'CDC retention configured to 7 days (10080 minutes).';
-- END TRY
-- BEGIN CATCH
--     PRINT CONCAT('CDC retention configuration: ', ERROR_MESSAGE());
-- END CATCH;
-- GO

-- /*==============================================================================
--     5. FINAL CDC STATUS
-- ==============================================================================*/
-- IF OBJECT_ID('CORE.usp_GetCdcProcessorStatus', 'P') IS NOT NULL
-- BEGIN
--     EXEC CORE.usp_GetCdcProcessorStatus;
-- END;
-- GO

-- /*==============================================================================
--     6. CDC JOB STATUS
-- ==============================================================================*/
-- BEGIN TRY
--     EXEC sys.sp_cdc_help_jobs;
-- END TRY
-- BEGIN CATCH
--     PRINT CONCAT('CDC job status: ', ERROR_MESSAGE());
-- END CATCH;
-- GO