import { Global, Module } from '@nestjs/common';
import { OpenAIService } from './services/openai.service';
import { VisionService } from './services/vision.service';

@Global()
@Module({
  providers: [OpenAIService, VisionService],
  exports: [OpenAIService, VisionService],
})
export class CommonModule {}
