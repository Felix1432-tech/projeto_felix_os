import { Global, Module } from '@nestjs/common';
import { OpenAIService } from './services/openai.service';

@Global()
@Module({
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class CommonModule {}
