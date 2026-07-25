import { useEffect, useRef } from "react";

export default function LazyVideo({
  src,
  poster,
  title,
  className,
}: {
  src: string;
  poster: string;
  title: string;
  className: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      // Margem generosa: o vídeo começa a carregar um pouco antes de aparecer,
      // então visualmente continua "sempre tocando" como no autoplay antigo.
      { rootMargin: "25% 25%" }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      preload="none"
      loop
      muted
      playsInline
      draggable={false}
      aria-label={title}
      className={className}
    />
  );
}
