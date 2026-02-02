import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DiagnosticsController } from './diagnostics.controller';
import { DiagnosticsService } from './diagnostics.service';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 25 * 1024 * 1024, // 25MB max (limite do Whisper)
      },
    }),
  ],
  controllers: [DiagnosticsController],
  providers: [DiagnosticsService],
  exports: [DiagnosticsService],
})
export class DiagnosticsModule {}
