import VideoForm from '@/app/components/ui/forms/VideoForm';

export default function CreateVideoPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Upload New Video</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <VideoForm />
      </div>
    </div>
  );
}