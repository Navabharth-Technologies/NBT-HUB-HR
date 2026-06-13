export const cleanEmpId = (id) => {
  if (!id) return '';
  const str = String(id);
  const match = str.match(/^(\d{5,6})\1+/);
  return match ? match[1] : (str.length >= 10 ? str.substring(0, 6) : str);
};
