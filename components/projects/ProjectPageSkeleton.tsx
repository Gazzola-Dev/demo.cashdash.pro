import { Card, CardContent, CardHeader } from "@/components/ui/card";

const ProjectPageSkeleton = () => {
  return (
    <div className="relative w-full max-w-6xl mx-auto">
      <div className="flex gap-6">
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-8 w-32 bg-gray-200 rounded-md animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse" />
              </div>

              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse" />
                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-10 bg-gray-200 rounded-md animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-4 w-28 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse" />
                <div className="h-4 w-48 bg-gray-200 rounded-md animate-pulse" />
              </div>

              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-24 w-full bg-gray-200 rounded-md animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-80 space-y-6">
          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse" />
                      <div className="h-3 w-32 bg-gray-200 rounded-md animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectPageSkeleton;
