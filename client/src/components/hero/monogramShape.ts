/**
 * Contornos da marca MF, traçados automaticamente do canal alpha de
 * client/public/logo2-removebg-preview.png pelo script scratchpad/trace.mjs.
 *
 * São TRÊS peças, não duas: o M inteiro, e os dois braços do F — que na marca
 * são cortados na diagonal onde encostam no M, e por isso não se tocam.
 *
 * Y cresce pra cima e a altura é normalizada em 3.4 unidades de cena. As peças
 * compartilham um sistema de coordenadas único, então o encaixe entre elas já
 * vem correto: quem usa só precisa centrar o grupo inteiro.
 *
 * Não editar à mão — regerar o script se a marca mudar. Os mesmos pontos
 * alimentam a geometria extrudada (three) e o SVG chapado de fallback.
 */

export type Point = readonly [number, number];

export const MONOGRAM_WIDTH = 6.628;
export const MONOGRAM_HEIGHT = 3.4;

export const MONOGRAM_SHAPES: readonly (readonly Point[])[] = [
  [
    [0.229, 3.4],
    [0.458, 3.381],
    [0.592, 3.285],
    [1.662, 2.063],
    [1.929, 1.815],
    [3.362, 3.285],
    [3.61, 3.381],
    [3.82, 3.324],
    [3.878, 3.228],
    [3.858, 0.458],
    [3.763, 0.382],
    [3.572, 0.363],
    [3.438, 0.42],
    [3.343, 0.554],
    [3.324, 2.464],
    [1.929, 0.993],
    [1.872, 1.012],
    [0.554, 2.464],
    [0.535, 0],
    [0.42, 0.019],
    [0.191, 0.172],
    [0.076, 0.306],
    [0, 0.497],
    [0, 3.19],
    [0.115, 3.362],
  ],
  [
    [4.584, 2.216],
    [6.17, 2.216],
    [6.227, 2.178],
    [6.227, 2.025],
    [6.151, 1.853],
    [5.96, 1.719],
    [4.718, 1.719],
    [4.622, 1.681],
    [4.565, 1.566],
    [4.565, 0.649],
    [4.412, 0.458],
    [4.164, 0.42],
    [4.088, 0.478],
    [4.088, 1.776],
    [4.164, 1.967],
    [4.26, 2.082],
    [4.374, 2.158],
  ],
  [
    [4.584, 3.324],
    [6.418, 3.324],
    [6.59, 3.285],
    [6.628, 3.209],
    [6.533, 2.942],
    [6.342, 2.808],
    [4.661, 2.789],
    [4.546, 2.655],
    [4.546, 2.369],
    [4.145, 2.254],
    [4.088, 2.33],
    [4.088, 2.808],
    [4.126, 2.961],
    [4.279, 3.19],
  ],
];

/** Converte um contorno em `d` de SVG (Y invertido: no SVG cresce pra baixo). */
export function outlineToPath(outline: readonly Point[]): string {
  const commands = outline.map(
    ([x, y], index) =>
      `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${(MONOGRAM_HEIGHT - y).toFixed(2)}`
  );
  return `${commands.join(" ")} Z`;
}
