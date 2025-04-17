import AudioForm from '@/app/components/ui/forms/AudioForm';

export default function CreateAudioPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Upload New Audio</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <AudioForm />
      </div>
    </div>
  );
}