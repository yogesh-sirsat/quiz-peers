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
        <Card className="w-full max-w-3xl bg-gradient-to-br from-cyan-900/80 via-indigo-900/70 to-amber-900/60 border border-cyan-200/25 shadow-2xl">
          <CardBody className="p-4 xs:p-6 gap-5">
            <div className="rounded-2xl border border-amber-200/25 bg-black/25 p-4">
              <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-amber-200">Create Similarity Quiz</h1>
              <p className="text-sm text-cyan-100/90 mt-2">
                Mode is set to <span className="font-semibold text-amber-200">SIMILARITY</span>. Questions are randomly selected.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-200/20 bg-black/20 p-4 flex flex-col gap-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-200/90 text-medium font-bold">Round Setup</div>
              <Input
                type="number"
                label="Question Count"
                labelPlacement="outside"
                value={String(questionCount)}
                min={1}
                max={20}
                onValueChange={(value) => setQuestionCount(Number(value))}
                description="Choose between 1 and 20 questions."
                classNames={{
                  label: "text-md pb-2",

                  inputWrapper: "h-14 rounded-xl border-2 border-cyan-200/40 bg-slate-950/20",
                  input: "text-lg font-bold text-cyan-100"
                }}
              />
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((count) => (
                  <Button
                    key={count}
                    variant={safeCount === count ? "solid" : "flat"}
                    color={safeCount === count ? "warning" : "default"}
                    className="font-bold"
                    onClick={() => setQuestionCount(count)}
                  >
                    {count}
                  </Button>
                ))}
              </div>
              <div className="text-xs uppercase tracking-wide text-amber-200">Using {safeCount} questions</div>
            </div>

            <div className="flex flex-col xs:flex-row gap-3">
              <Button
                color="secondary"
                className="font-black flex-1 h-12"
                onClick={handleJoinPublic}
                isLoading={isLoadingPublicRoomId}
              >
                Join Public
              </Button>
              <Button
                color="primary"
                className="font-black flex-1 h-12"
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
