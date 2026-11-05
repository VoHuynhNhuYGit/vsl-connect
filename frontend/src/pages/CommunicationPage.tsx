import { TextToSpeechPanel } from '../components/speech/TextToSpeechPanel';

export function CommunicationPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="mb-7 text-headline-xl">Giao tiếp</h1>
      <TextToSpeechPanel />
    </div>
  );
}
