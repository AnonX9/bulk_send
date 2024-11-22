import FileImporter from '@/components/FileImporter'

export default function Home() {
  return (
    <main className="container mx-auto p-4 min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-6xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-[#FF0000] via-[#4169E1] to-[#FFA500]">
        Bulk SMS Sender
      </h1>
      <FileImporter />
    </main>
  )
}

