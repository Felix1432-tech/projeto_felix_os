import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obter perfil do usuário logado' })
  @ApiResponse({ status: 200, description: 'Perfil retornado' })
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.sub);
  }

  @Put('me')
  @ApiOperation({ summary: 'Atualizar perfil do usuário logado' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado' })
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.tenantId, req.user.sub, updateUserDto);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Alterar senha do usuário logado' })
  @ApiResponse({ status: 200, description: 'Senha alterada' })
  @ApiResponse({ status: 401, description: 'Senha atual incorreta' })
  async changeMyPassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.tenantId, req.user.sub, changePasswordDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os usuários da oficina' })
  @ApiResponse({ status: 200, description: 'Lista de usuários retornada' })
  async findAll(@Request() req) {
    return this.usersService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findById(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.findById(req.user.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo usuário (mecânico, recepcionista, etc)' })
  @ApiResponse({ status: 201, description: 'Usuário criado' })
  @ApiResponse({ status: 403, description: 'Sem permissão ou limite atingido' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  async create(@Request() req, @Body() createUserDto: CreateUserDto) {
    return this.usersService.create(req.user.tenantId, req.user.role, createUserDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.tenantId, id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar usuário (soft delete)' })
  @ApiResponse({ status: 200, description: 'Usuário desativado' })
  @ApiResponse({ status: 403, description: 'Não pode excluir a si mesmo' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async delete(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.delete(req.user.tenantId, id, req.user.sub);
  }
}
