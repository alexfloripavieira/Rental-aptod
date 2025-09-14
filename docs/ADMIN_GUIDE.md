# Guia de Usuário – Django Admin

## Acesso
- URL: `/admin/`
- Necessário superusuário: `docker compose exec backend python manage.py createsuperuser`

## Cadastros principais
- Empreendimentos (Builders): cadastrar nome/endereço e fotos em inline
- Apartamentos (Aptos): associar a uma construtora, definir atributos, fotos e vídeo

## Boas práticas
- Tamanhos de mídia: preferir imagens otimizadas (≤ 2MB)
- Vídeos: mp4 (H.264), duração curta; usar CDN em produção se volume alto
- Campos obrigatórios sinalizados no Admin

## Troubleshooting comum
- Upload falhou: conferir permissões de `/app/media` (volume `media_volume`)
- Imagens não aparecem no site: validar `MEDIA_URL` e `Nginx /media/`
