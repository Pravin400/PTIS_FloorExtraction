using Microsoft.EntityFrameworkCore;
using NtisPlatform.Core.Entities.Reporting;

namespace NtisPlatform.Infrastructure.Data;

internal static class HtmlReportingModelConfiguration
{
    public static void Configure(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<HtmlReportTemplateEntity>(entity =>
        {
            entity.ToTable("HtmlReportTemplate");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.TemplateCode).HasMaxLength(100).IsRequired();
            entity.Property(e => e.TemplateName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.DataSourceCode).HasMaxLength(100).IsRequired();
            entity.Property(e => e.CreatedDate).HasColumnType("datetime2");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime2");
            entity.Property(e => e.RowVersion).IsRowVersion();

            entity.HasIndex(e => new { e.OrganizationId, e.TemplateCode }).IsUnique();
            entity.HasIndex(e => new { e.ReportDefinitionId, e.IsActive });

            entity.HasMany(e => e.Versions)
                  .WithOne(e => e.Template)
                  .HasForeignKey(e => e.TemplateId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<HtmlReportTemplateVersionEntity>(entity =>
        {
            // This table has TR_HtmlReportTemplateVersion_ImmutablePublished. SQL Server rejects
            // EF Core's direct OUTPUT clause for trigger-bearing tables, so use the compatible
            // INSERT/UPDATE path that captures generated identity and rowversion values safely.
            entity.ToTable("HtmlReportTemplateVersion", table => table.UseSqlOutputClause(false));
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.Status).HasMaxLength(20).IsRequired();
            entity.Property(e => e.TemplateJson).IsRequired();
            entity.Property(e => e.ContentHash).HasMaxLength(32).IsRequired();
            entity.Property(e => e.CreatedDate).HasColumnType("datetime2");
            entity.Property(e => e.PublishedDate).HasColumnType("datetime2");
            entity.Property(e => e.ArchivedDate).HasColumnType("datetime2");
            entity.Property(e => e.RowVersion).IsRowVersion();

            entity.HasIndex(e => new { e.TemplateId, e.VersionNo }).IsUnique();
            entity.HasIndex(e => e.TemplateId)
                  .IsUnique()
                  .HasFilter("[Status] = 'Published'")
                  .HasDatabaseName("UX_HtmlReportTemplateVersion_Published");
        });

        modelBuilder.Entity<HtmlReportFragmentEntity>(entity =>
        {
            entity.ToTable("HtmlReportFragment");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.FragmentCode).HasMaxLength(100).IsRequired();
            entity.Property(e => e.FragmentName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.CreatedDate).HasColumnType("datetime2");
            entity.Property(e => e.UpdatedDate).HasColumnType("datetime2");
            entity.Property(e => e.RowVersion).IsRowVersion();

            entity.HasIndex(e => new { e.OrganizationId, e.FragmentCode }).IsUnique();
        });

        modelBuilder.Entity<HtmlReportFragmentVersionEntity>(entity =>
        {
            // HtmlReportFragmentVersion has the equivalent immutable-published trigger.
            entity.ToTable("HtmlReportFragmentVersion", table => table.UseSqlOutputClause(false));
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.Status).HasMaxLength(20).IsRequired();
            entity.Property(e => e.FragmentJson).IsRequired();
            entity.Property(e => e.ContentHash).HasMaxLength(32).IsRequired();
            entity.Property(e => e.RowVersion).IsRowVersion();

            entity.HasIndex(e => new { e.FragmentId, e.VersionNo }).IsUnique();
            entity.HasIndex(e => e.FragmentId)
                  .IsUnique()
                  .HasFilter("[Status] = 'Published'")
                  .HasDatabaseName("UX_HtmlReportFragmentVersion_Published");

            entity.HasOne(e => e.Fragment)
                  .WithMany(e => e.Versions)
                  .HasForeignKey(e => e.FragmentId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<HtmlReportTemplateFragmentEntity>(entity =>
        {
            entity.ToTable("HtmlReportTemplateFragment");
            entity.HasKey(e => new { e.TemplateVersionId, e.FragmentVersionId });

            entity.Property(e => e.FragmentCode).HasMaxLength(100).IsRequired();

            entity.HasOne(e => e.TemplateVersion)
                  .WithMany(e => e.Fragments)
                  .HasForeignKey(e => e.TemplateVersionId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.FragmentVersion)
                  .WithMany()
                  .HasForeignKey(e => e.FragmentVersionId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<HtmlReportJobEntity>(entity =>
        {
            entity.ToTable("HtmlReportJob");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever();

            entity.Property(e => e.PlatformBaseUrl).HasMaxLength(500).IsRequired();
            entity.Property(e => e.ReportCode).HasMaxLength(100).IsRequired();
            entity.Property(e => e.DataProviderCode).HasMaxLength(100).IsRequired();
            entity.Property(e => e.JobType).HasMaxLength(20).IsRequired();
            entity.Property(e => e.OutputMode).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(30).IsRequired();
            entity.Property(e => e.Stage).HasMaxLength(30).IsRequired();
            entity.Property(e => e.LeaseOwner).HasMaxLength(200);
            entity.Property(e => e.IdempotencyKey).HasMaxLength(200);
            entity.Property(e => e.ShortLivedToken).HasMaxLength(2000);
            entity.Property(e => e.SltConsumed).IsRequired();
            entity.Property(e => e.ErrorCode).HasMaxLength(100);
            entity.Property(e => e.RowVersion).IsRowVersion();

            entity.HasIndex(e => new { e.Status, e.NextAttemptDate, e.CreatedDate });
            entity.HasIndex(e => new { e.JobType, e.Status, e.CreatedDate }).HasDatabaseName("IX_HtmlReportJob_TypeStatusCreated");
            entity.HasIndex(e => new { e.OrganizationId, e.Status, e.CreatedDate });
            entity.HasIndex(e => new { e.RequestedByUserId, e.CreatedDate });
            entity.HasIndex(e => e.TemplateVersionId);
            entity.HasIndex(e => new { e.OrganizationId, e.IdempotencyKey })
                  .IsUnique()
                  .HasFilter("[IdempotencyKey] IS NOT NULL");
        });

        modelBuilder.Entity<HtmlReportChunkEntity>(entity =>
        {
            entity.ToTable("HtmlReportChunk");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.StartKey).HasMaxLength(200);
            entity.Property(e => e.EndKey).HasMaxLength(200);
            entity.Property(e => e.Status).HasMaxLength(30).IsRequired();
            entity.Property(e => e.OutputPath).HasMaxLength(1000);
            entity.Property(e => e.ErrorMessage).HasMaxLength(2000);
            entity.Property(e => e.RowVersion).IsRowVersion();

            entity.HasIndex(e => new { e.JobId, e.ChunkNumber })
                  .IsUnique()
                  .HasDatabaseName("UX_HtmlReportChunk_JobNumber");
            entity.HasIndex(e => new { e.OrganizationId, e.Status, e.JobId })
                  .HasDatabaseName("IX_HtmlReportChunk_TenantStatusJob");

            entity.HasOne(e => e.Job)
                  .WithMany(e => e.Chunks)
                  .HasForeignKey(e => e.JobId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<HtmlReportJobItemEntity>(entity =>
        {
            entity.ToTable("HtmlReportJobItem");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.RecordKey).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(30).IsRequired();
            entity.Property(e => e.ErrorCode).HasMaxLength(100);
            entity.Property(e => e.ErrorMessage).HasMaxLength(2000);
            entity.Property(e => e.RowVersion).IsRowVersion();

            entity.HasIndex(e => new { e.JobId, e.RecordKey }).IsUnique();
            entity.HasIndex(e => new { e.JobId, e.BatchNumber, e.Status });
            entity.HasIndex(e => new { e.JobId, e.Status });

            entity.HasOne(e => e.Job)
                  .WithMany(e => e.Items)
                  .HasForeignKey(e => e.JobId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<HtmlReportFileEntity>(entity =>
        {
            entity.ToTable("HtmlReportFile");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever();

            entity.Property(e => e.FileName).HasMaxLength(260).IsRequired();
            entity.Property(e => e.ContentType).HasMaxLength(100).IsRequired();
            entity.Property(e => e.ContentHash).HasMaxLength(32);

            entity.HasIndex(e => e.DocumentGuid).IsUnique();
            entity.HasIndex(e => new { e.JobId, e.BatchNumber });
            entity.HasIndex(e => new { e.JobId, e.JobItemId })
                  .IsUnique()
                  .HasFilter("[JobItemId] IS NOT NULL")
                  .HasDatabaseName("UX_HtmlReportFile_JobItem");
            entity.HasIndex(e => new { e.JobId, e.BatchNumber })
                  .IsUnique()
                  .HasFilter("[JobItemId] IS NULL AND [BatchNumber] IS NOT NULL")
                  .HasDatabaseName("UX_HtmlReportFile_LogicalBatch");

            entity.HasOne(e => e.Job)
                  .WithMany(e => e.Files)
                  .HasForeignKey(e => e.JobId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<HtmlReportOutboxEntity>(entity =>
        {
            entity.ToTable("HtmlReportOutbox");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever();

            entity.Property(e => e.MessageType).HasMaxLength(100).IsRequired();
            entity.Property(e => e.PayloadJson).IsRequired();
            entity.Property(e => e.LastError).HasMaxLength(2000);
            entity.Property(e => e.RowVersion).IsRowVersion();

            entity.HasIndex(e => new { e.PublishedDate, e.NextAttemptDate, e.OccurredDate });
            entity.HasIndex(e => e.OccurredDate)
                  .HasFilter("[PublishedDate] IS NULL")
                  .HasDatabaseName("IX_HtmlReportOutbox_Unpublished");
        });

        modelBuilder.Entity<HtmlReportJobLogEntity>(entity =>
        {
            entity.ToTable("HtmlReportJobLog");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.Property(e => e.FromStatus).HasMaxLength(30);
            entity.Property(e => e.ToStatus).HasMaxLength(30);
            entity.Property(e => e.Message).HasMaxLength(2000);
            entity.Property(e => e.WorkerId).HasMaxLength(200);

            entity.HasIndex(e => new { e.JobId, e.CreatedDate });
            entity.HasIndex(e => new { e.JobItemId, e.CreatedDate });
        });

        modelBuilder.Entity<HtmlReportWorkerInstanceEntity>(entity =>
        {
            entity.ToTable("HtmlReportWorkerInstance");
            entity.HasKey(e => e.WorkerInstanceId);
            entity.Property(e => e.WorkerInstanceId).ValueGeneratedNever();

            entity.Property(e => e.WorkerName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.MachineName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Version).HasMaxLength(50);
        });
    }
}
