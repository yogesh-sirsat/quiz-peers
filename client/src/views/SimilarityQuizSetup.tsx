import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, Input } from "@nextui-org/react";
import NavbarComponent from "../components/ui/Navbar";
import { useLazyGetIdForPrivateRoomQuery, useLazyGetPublicRoomIdQuery } from "../store/api/roomsApi";

export default function SimilarityQuizSetup() {
  const navigate = useNavigate();
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [triggerPublicRoomId, { isLoading: isLoadingPublicRoomId }] = useLazyGetPublicRoomIdQuery();
  const [triggerPrivateRoomId, { isLoading: isLoadingPrivateRoomId }] = useLazyGetIdForPrivateRoomQuery();

  const safeCount = Math.max(1, Math.min(20, Number(questionCount) || 10));

  const goToRoom = (roomId: string, isPublic: boolean) => {
    navigate(`/quiz/0/${roomId}?public=${isPublic}&mode=SIMILARITY&count=${safeCount}`);
  };

  const handleJoinPublic = async () => {
    try {
      const response: any = await triggerPublicRoomId({
        mode: "SIMILARITY",
        similarityQuestionCount: safeCount
      });
      if (response.isError) {
        throw new Error(response.error?.data?.message || "Could not join public room");
      }
      if (response.data?.roomId) {
        goToRoom(response.data.roomId, true);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleCreatePrivate = async () => {
    try {
      const response: any = await triggerPrivateRoomId({
        mode: "SIMILARITY",
        similarityQuestionCount: safeCount
      });
      if (response.isError) {
        throw new Error(response.error?.data?.message || "Could not create private room");
      }
      if (response.data?.roomId) {
        goToRoom(response.data.roomId, false);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <section className="min-w-screen">
      <NavbarComponent />
      <section className="flex flex-col items-center px-3 pt-6 pb-10">
        <Card className="w-full max-w-2xl bg-background/60 shadow-2xl">
          <CardBody className="p-6 gap-4">
            <h1 className="text-2xl font-semibold">Create Similarity Quiz</h1>
            <p className="text-sm opacity-80">
              Mode is set to <span className="font-semibold">SIMILARITY</span>. Questions are randomly selected.
            </p>
            <Input
              type="number"
              label="Question Count"
              labelPlacement="outside"
              value={String(questionCount)}
              min={1}
              max={20}
              onValueChange={(value) => setQuestionCount(Number(value))}
              description="Choose between 1 and 20 questions."
            />
            <div className="text-xs uppercase tracking-wide opacity-70">Using {safeCount} questions</div>
            <div className="flex gap-3">
              <Button
                color="secondary"
                className="font-semibold flex-1"
                onClick={handleJoinPublic}
                isLoading={isLoadingPublicRoomId}
              >
                Join Public
              </Button>
              <Button
                color="primary"
                className="font-semibold flex-1"
                onClick={handleCreatePrivate}
                isLoading={isLoadingPrivateRoomId}
              >
                Create Private
              </Button>
            </div>
          </CardBody>
        </Card>
      </section>
    </section>
  );
}
