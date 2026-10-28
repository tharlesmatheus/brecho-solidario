/**
 * Reduz a foto no próprio celular antes de enviar (máx. 1280px, JPEG ~80%).
 * Uma foto de 4 MB vira ~200 KB, o que mantém o projeto dentro do plano grátis do Supabase.
 */
export async function comprimirImagem(arquivo: File, ladoMax = 1280, qualidade = 0.8): Promise<Blob> {
  if (!arquivo.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem.");
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, ladoMax / Math.max(bitmap.width, bitmap.height));
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);
  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem.");
  ctx.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", qualidade));
  if (!blob) throw new Error("Não foi possível processar a imagem.");
  return blob;
}
