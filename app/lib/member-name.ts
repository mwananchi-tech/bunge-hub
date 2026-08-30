export function formatMemberName(name: string): string {
  const letters = name.replace(/[^\p{L}]/gu, "");
  if (!letters || letters !== letters.toLocaleUpperCase("en-KE")) return name;

  return name
    .toLocaleLowerCase("en-KE")
    .replace(/(^|[^\p{L}\p{N}])(\p{L})/gu, (_, boundary, letter) => {
      return boundary + letter.toLocaleUpperCase("en-KE");
    });
}
