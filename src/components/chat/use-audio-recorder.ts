"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_AUDIO_RECORDING_SECONDS } from "@/lib/validation/audio-capture";

const recordingMimeTypes = [
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/webm",
];

type UseAudioRecorderOptions = {
  onComplete: (file: File) => void;
  onError: (message: string) => void;
};

function extensionFor(mimeType: string) {
  if (mimeType.startsWith("audio/mp4")) return "m4a";
  if (mimeType.startsWith("audio/ogg")) return "ogg";
  return "webm";
}

export function useAudioRecorder({
  onComplete,
  onError,
}: UseAudioRecorderOptions) {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const discardRef = useRef(false);
  const completeRef = useRef(onComplete);
  const errorRef = useRef(onError);

  useEffect(() => {
    completeRef.current = onComplete;
    errorRef.current = onError;
  }, [onComplete, onError]);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const cancelRecording = useCallback(() => {
    discardRef.current = true;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    else releaseStream();
  }, [releaseStream]);

  const startRecording = useCallback(async () => {
    if (
      typeof MediaRecorder === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setSupported(false);
      errorRef.current(
        "Este navegador no permite grabar audio. Puedes subir un archivo.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = recordingMimeTypes.find((candidate) =>
        MediaRecorder.isTypeSupported(candidate),
      );
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType, audioBitsPerSecond: 64_000 } : undefined,
      );
      recorderRef.current = recorder;
      chunksRef.current = [];
      discardRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        errorRef.current("La grabación se interrumpió. Inténtalo nuevamente.");
      };
      recorder.onstop = () => {
        const shouldDiscard = discardRef.current;
        const finalMimeType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: finalMimeType });
        chunksRef.current = [];
        recorderRef.current = null;
        releaseStream();
        setRecording(false);

        if (!shouldDiscard && blob.size) {
          completeRef.current(
            new File(
              [blob],
              `grabacion-lifeos.${extensionFor(finalMimeType)}`,
              { type: finalMimeType },
            ),
          );
        }
      };

      recorder.start(1_000);
      setElapsedSeconds(0);
      setRecording(true);
    } catch (error) {
      releaseStream();
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        errorRef.current(
          "No hay permiso para usar el micrófono. Autorízalo o sube un archivo.",
        );
      } else {
        errorRef.current(
          "No pude iniciar el micrófono. Puedes subir un archivo de audio.",
        );
      }
    }
  }, [releaseStream]);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => {
        const next = current + 1;
        if (next >= MAX_AUDIO_RECORDING_SECONDS) {
          window.clearInterval(timer);
          stopRecording();
          return MAX_AUDIO_RECORDING_SECONDS;
        }
        return next;
      });
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [recording, stopRecording]);

  useEffect(() => {
    const supportCheck = window.setTimeout(() => {
      setSupported(
        typeof MediaRecorder !== "undefined" &&
          Boolean(navigator.mediaDevices?.getUserMedia),
      );
    }, 0);
    return () => {
      window.clearTimeout(supportCheck);
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }
      releaseStream();
    };
  }, [releaseStream]);

  return {
    supported,
    recording,
    elapsedSeconds,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
