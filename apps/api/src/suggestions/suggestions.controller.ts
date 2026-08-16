import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { createSuggestionSchema, type CreateSuggestionInput } from '@pescaba/shared';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SuggestionsService } from './suggestions.service';

@ApiTags('suggestions')
@Controller('sites')
export class SuggestionsController {
  constructor(private readonly suggestions: SuggestionsService) {}

  /**
   * Sugerir un lugar nuevo. Requiere declarar que la información es correcta.
   * La sugerencia queda pendiente de moderación.
   */
  @Public()
  @Post('suggestions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Sugerir un nuevo lugar (queda pendiente de moderación)' })
  create(
    @Body(new ZodValidationPipe(createSuggestionSchema)) body: CreateSuggestionInput,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.suggestions.create(body, user?.id);
  }
}
