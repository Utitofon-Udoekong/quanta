import AudioForm from '@/app/components/ui/forms/AudioForm';

export default function CreateAudioPage() {
  return (
    <div className='my-8'>
      <h1 className="text-2xl font-bold mb-6">Upload New Audio</h1>
      <div className="bg-[#1a1f28] shadow-md rounded-lg p-6">
        <AudioForm />
      </div>
    </div>
  );
}