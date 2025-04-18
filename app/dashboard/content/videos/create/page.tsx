import VideoForm from '@/app/components/ui/forms/VideoForm';

export default function CreateVideoPage() {
  return (
    <div className='my-8'>
      <h1 className="text-2xl font-bold mb-6">Upload New Video</h1>
      <div className="bg-[#1a1f28] shadow-md rounded-lg p-6">
        <VideoForm />
      </div>
    </div>
  );
}