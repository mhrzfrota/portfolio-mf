import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import {
  ExtrudeGeometry,
  Group,
  MathUtils,
  Shape,
  type BufferGeometry,
} from "three";
import {
  MONOGRAM_HEIGHT,
  MONOGRAM_SHAPES,
  MONOGRAM_WIDTH,
  type Point,
} from "./monogramShape";

const DEPTH = 0.72;

/**
 * Telas touch = GPU de celular: o mesmo cromo custa caro demais lá. Menos
 * pixels (dpr 1.5), environment menor e shader sem clearcoat/iridescence
 * mantêm o visual metálico sem saturar a GPU — é essa saturação que fazia o
 * arraste da logo, o scroll e a troca de tema engasgarem no mobile.
 */
const COARSE_POINTER =
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: coarse)").matches;

/** Estado de arraste compartilhado entre o handler de ponteiro e o loop de render. */
type Spin = {
  angle: number;
  velocity: number;
  dragging: boolean;
  lastX: number;
};

function buildGeometry(outline: readonly Point[]): ExtrudeGeometry {
  const shape = new Shape();
  shape.moveTo(outline[0][0], outline[0][1]);
  for (let i = 1; i < outline.length; i++) {
    shape.lineTo(outline[i][0], outline[i][1]);
  }
  shape.closePath();

  // Bisel fino: o V do M é uma ponta muito aguda e um chanfro largo a arredonda.
  const geometry = new ExtrudeGeometry(shape, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.055,
    bevelSize: 0.04,
    bevelOffset: 0,
    bevelSegments: 3,
    curveSegments: 2,
  });
  return geometry;
}

function Monogram({ spin, reduced }: { spin: Spin; reduced: boolean }) {
  const group = useRef<Group>(null);
  const { pointer, viewport } = useThree();

  const geometries = useMemo(() => MONOGRAM_SHAPES.map(buildGeometry), []);

  useEffect(() => {
    const disposable: BufferGeometry[] = geometries;
    return () => disposable.forEach(geometry => geometry.dispose());
  }, [geometries]);

  // O monograma tem ~6.6 unidades de largura: encolhe junto com a viewport
  // pra nunca encostar nas bordas no mobile.
  const scale = MathUtils.clamp(viewport.width / 8.4, 0.52, 1);

  useFrame((state, delta) => {
    const node = group.current;
    if (!node || reduced) return;

    if (!spin.dragging) {
      spin.angle += spin.velocity;
      spin.velocity *= 0.94;
    }

    const t = state.clock.elapsedTime;
    const targetY = spin.angle + pointer.x * 0.4 + Math.sin(t * 0.24) * 0.09;
    const targetX = -pointer.y * 0.22 + Math.sin(t * 0.38) * 0.05;

    node.rotation.y = MathUtils.damp(node.rotation.y, targetY, 4, delta);
    node.rotation.x = MathUtils.damp(node.rotation.x, targetX, 4, delta);
    node.position.y = Math.sin(t * 0.55) * 0.14;
  });

  return (
    <group ref={group} scale={scale} rotation={[0.06, -0.32, 0]}>
      {/* as 3 peças compartilham as coordenadas da marca, então basta centrar
          o conjunto — o encaixe entre M e F já vem correto do traçado */}
      <group position={[-MONOGRAM_WIDTH / 2, -MONOGRAM_HEIGHT / 2, -DEPTH / 2]}>
        {geometries.map((geometry, index) => (
          <mesh key={index} geometry={geometry}>
            <ChromeMaterial />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Cromo: metal puro, então quem "pinta" a peça é inteiramente o environment. */
function ChromeMaterial() {
  // No touch, o standard entrega o mesmo metal espelhado (metalness + envMap)
  // sem os dois lóbulos especulares extras de clearcoat/iridescence — a ~250px
  // de largura a diferença é imperceptível, o custo por frame não.
  if (COARSE_POINTER) {
    return (
      <meshStandardMaterial
        color="#e2ebff"
        metalness={1}
        roughness={0.12}
        envMapIntensity={1.15}
      />
    );
  }

  return (
    <meshPhysicalMaterial
      color="#e2ebff"
      metalness={1}
      roughness={0.14}
      clearcoat={1}
      clearcoatRoughness={0.05}
      iridescence={0.4}
      iridescenceIOR={1.6}
      iridescenceThicknessRange={[120, 620]}
      envMapIntensity={1.15}
    />
  );
}

/**
 * O environment é um estúdio, não um céu: fundo escuro com faixas de luz.
 * Cromo só lê como cromo quando reflete claro E escuro — num environment
 * uniformemente claro a peça vira uma mancha branca. É esse contraste que
 * devolve o grafite da marca sobre o céu claro.
 */
function SkyEnvironment({ isDark }: { isDark: boolean }) {
  // 128 no touch: o PMREM do environment é re-bakeado a cada troca de tema e
  // seu custo cresce com a resolução — metade da resolução corta o engasgo
  // do toggle; nos reflexos borrados do cromo a perda não aparece.
  return (
    <Environment resolution={COARSE_POINTER ? 128 : 256} frames={1}>
      <color attach="background" args={[isDark ? "#03060f" : "#0a1637"]} />

      {/* faixa larga de céu no alto: acende as faces superiores */}
      <Lightformer
        form="rect"
        intensity={isDark ? 3 : 4}
        color="#ffffff"
        position={[0, 6, -3]}
        scale={[14, 6, 1]}
      />
      {/* luz de frente: sem ela as faces viradas pra câmera só refletem o fundo
          escuro e o monograma vira uma silhueta chapada em vez de metal polido */}
      <Lightformer
        form="rect"
        intensity={isDark ? 1.4 : 1.15}
        color={isDark ? "#93aaff" : "#c3d6ff"}
        position={[0, 1, 9]}
        scale={[10, 6, 1]}
      />
      {/* azul de brand pela esquerda */}
      <Lightformer
        form="rect"
        intensity={isDark ? 3 : 2.6}
        color="#2f5bff"
        position={[-7, 1, 2]}
        rotation-y={Math.PI / 2}
        scale={[8, 9, 1]}
      />
      {/* realce frio na direita: é ele que desenha a aresta do bisel */}
      <Lightformer
        form="rect"
        intensity={isDark ? 3.4 : 3}
        color={isDark ? "#c8daff" : "#eef4ff"}
        position={[7, 0.5, 2]}
        rotation-y={-Math.PI / 2}
        scale={[8, 9, 1]}
      />
      {/* especulares pontuais: fazem o metal cintilar enquanto gira */}
      <Lightformer
        form="ring"
        intensity={6}
        color="#ffffff"
        position={[3.5, 3.5, 5]}
        scale={2.4}
      />
      <Lightformer
        form="circle"
        intensity={4}
        color="#7c8cff"
        position={[-4.5, -2, 4]}
        scale={1.8}
      />
    </Environment>
  );
}

type MonogramSceneProps = {
  isDark: boolean;
  reduced: boolean;
};

export default function MonogramScene({ isDark, reduced }: MonogramSceneProps) {
  const spin = useRef<Spin>({
    angle: 0,
    velocity: 0,
    dragging: false,
    lastX: 0,
  }).current;

  // Quando o hero sai da tela o loop de render para (frameloop="demand"):
  // rolar a página deixa de custar GPU. O último frame fica congelado e a
  // animação retoma ao voltar — visualmente nada muda.
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    spin.dragging = true;
    spin.velocity = 0;
    spin.lastX = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!spin.dragging) return;
    const dx = event.clientX - spin.lastX;
    spin.lastX = event.clientX;
    spin.angle += dx * 0.008;
    spin.velocity = dx * 0.008;
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!spin.dragging) return;
    spin.dragging = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      ref={containerRef}
      className="h-full w-full cursor-grab active:cursor-grabbing"
      // pan-y devolve o scroll vertical ao navegador: no celular o dedo pra cima
      // rola a página, e só o gesto horizontal gira a peça.
      style={{ touchAction: "pan-y" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <Canvas
        dpr={COARSE_POINTER ? [1, 1.5] : [1, 2]}
        camera={{ position: [0, 0, 12], fov: 25 }}
        gl={{
          // Em telas densas (retina/celular) o MSAA fica imperceptível — os
          // pixels físicos já suavizam as bordas — mas dobra o custo de GPU.
          antialias:
            typeof window === "undefined" || window.devicePixelRatio < 2,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
        frameloop={reduced || !inView ? "demand" : "always"}
      >
        <SkyEnvironment isDark={isDark} />
        <Monogram spin={spin} reduced={reduced} />
      </Canvas>
    </div>
  );
}
