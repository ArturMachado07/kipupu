"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Button } from "./Button";

/**
 * Leitor de QR code via câmara do browser (getUserMedia + canvas + jsQR).
 * Sem dependências pagas nem serviços externos — tudo corre no cliente.
 */
export function LeitorQr({ onDetectado }: { onDetectado: (codigo: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [aScanear, setAScanear] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function pararCamara() {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setAScanear(false);
  }

  async function iniciarCamara() {
    setErro(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setAScanear(true);
      loopDeteccao();
    } catch {
      setErro("Não foi possível aceder à câmara. Verifica as permissões do browser, ou digita o código manualmente.");
    }
  }

  function loopDeteccao() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tick = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const resultado = jsQR(imageData.data, imageData.width, imageData.height);
        if (resultado?.data) {
          pararCamara();
          onDetectado(resultado.data);
          return;
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    return () => pararCamara();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {!aScanear ? (
        <Button onClick={iniciarCamara} className="w-full">
          Ativar câmara para ler QR code
        </Button>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-kipupu-gray100">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} className="w-full h-64 object-cover bg-black" muted playsInline />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-40 h-40 border-4 border-kipupu-cyan rounded-md" />
          </div>
          <Button variant="ghost" onClick={pararCamara} className="w-full rounded-t-none">
            Parar câmara
          </Button>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      {erro && <p className="text-red-600 text-sm mt-2">{erro}</p>}
    </div>
  );
}
