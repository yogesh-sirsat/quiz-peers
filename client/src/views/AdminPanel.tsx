import React, { useState, useMemo } from "react";
import {
  Button,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Tooltip,
  Select,
  SelectItem,
} from "@nextui-org/react";
import {
  useGetAllQuizzesQuery,
  useCreateQuizMutation,
  useUpdateQuizMutation,
  useDeleteQuizMutation,
  useGetQuizByIdQuery,
} from "../store/api/quizzesApi";
import { Trash2, Edit, Plus, Image as ImageIcon } from "lucide-react";
import NavbarComponent from "../components/ui/Navbar";
import supabase from "../utils/supabase";
import { useNavigate } from "react-router-dom";
import { QuizDTO } from "../types";
import { FileUpload } from "../components/admin/FileUpload";
import { QuestionsManager } from "../components/admin/QuestionsManager";

interface QuizForm {
  quizId?: number;
  quizName: string;
  description: string;
  coverImageUrl: string;
  status: string;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { data: quizzes, isLoading: loadingQuizzes } = useGetAllQuizzesQuery({ onlyValid: false, includeTesting: true });
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const { data: quizDetails } = useGetQuizByIdQuery(Number(selectedQuizId), {
    skip: !selectedQuizId,
  });

  const [createQuiz] = useCreateQuizMutation();
  const [updateQuiz] = useUpdateQuizMutation();
  const [deleteQuiz] = useDeleteQuizMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const { isOpen: isQuizModalOpen, onOpen: onQuizModalOpen, onOpenChange: onQuizModalOpenChange } = useDisclosure();
  const [quizModalMode, setQuizModalMode] = useState<"create" | "edit">("create");
  const [quizForm, setQuizForm] = useState<QuizForm>({ quizName: "", description: "", coverImageUrl: "", status: "draft" });

  const filteredQuizzes = useMemo(() => {
    if (!quizzes) return [];
    return quizzes.filter(q => 
        q.quizName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [quizzes, searchQuery]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const handleOpenCreateQuiz = () => {
    setQuizModalMode("create");
    setQuizForm({ quizName: "", description: "", coverImageUrl: "", status: "draft" });
    onQuizModalOpen();
  };

  const handleOpenEditQuiz = (quiz: QuizDTO) => {
    setQuizModalMode("edit");
    setQuizForm({
      quizId: Number(quiz.quizId),
      quizName: quiz.quizName,
      description: quiz.description || "",
      coverImageUrl: quiz.coverImageUrl || "",
      status: quiz.status || "draft"
    });
    onQuizModalOpen();
  };

  const setFormStatus = (status: string) => {
    setQuizForm({ ...quizForm, status });
  };

  const handleSubmitQuiz = async () => {
    try {
      if (quizModalMode === "create") {
        await createQuiz({
          quizName: quizForm.quizName,
          description: quizForm.description,
          coverImageUrl: quizForm.coverImageUrl,
          status: quizForm.status as any
        }).unwrap();
      } else {
        await updateQuiz({
          quizId: Number(quizForm.quizId),
          quizName: quizForm.quizName,
          description: quizForm.description,
          coverImageUrl: quizForm.coverImageUrl,
          status: quizForm.status as any
        }).unwrap();
      }
      onQuizModalOpenChange();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (window.confirm("Are you sure you want to delete this quiz?")) {
      const deleteQuestions = window.confirm("Do you also want to delete all associated questions that aren't used in other quizzes?");
      await deleteQuiz({ quizId: Number(quizId), deleteQuestions }).unwrap();
      if (selectedQuizId === quizId) setSelectedQuizId(null);
    }
  };

  return (
    <section className="min-h-screen bg-background text-foreground">
      <NavbarComponent isAdmin={true} />
      <div className="max-w-7xl mx-auto p-3 xxs:p-4 xs:p-6">
        <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-4 mb-6">
          <h1 className="text-2xl xs:text-3xl font-bold text-foreground">Quiz Admin Panel</h1>
          <div className="flex gap-2 xxs:gap-3 w-full xs:w-auto">
            <Button 
                color="primary" 
                variant="solid"
                startContent={<Plus size={18} />} 
                onClick={handleOpenCreateQuiz}
                className="font-semibold shadow-lg flex-1 xs:flex-none"
            >
              New Quiz
            </Button>
            <Button color="danger" variant="flat" onClick={handleLogout} className="font-semibold flex-1 xs:flex-none">
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 shadow-2xl border-none">
            <CardHeader className="flex flex-col items-start px-6 pt-6">
              <h2 className="text-xl font-bold text-foreground">Your Quizzes</h2>
              <p className="text-small text-default-600 font-medium">Manage your quiz collection</p>
              <div className="w-full mt-4">
                <Input
                  isClearable
                  placeholder="Search quizzes..."
                  size="sm"
                  variant="flat"
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  onClear={() => setSearchQuery("")}
                  classNames={{
                    input: "text-foreground font-medium",
                    inputWrapper: "bg-default-100",
                  }}
                />
              </div>
            </CardHeader>
            <Divider className="my-3" />
            <CardBody className="p-0 max-h-[70vh] overflow-y-auto">
              {loadingQuizzes ? (
                <div className="p-6 flex justify-center text-foreground font-medium">Loading quizzes...</div>
              ) : (
                <div className="flex flex-col">
                  {filteredQuizzes?.map((quiz) => (
                    <div
                      key={quiz.quizId}
                      className={`p-4 border-b border-default-100 cursor-pointer hover:bg-default-50 flex justify-between items-center transition-all ${
                        selectedQuizId === quiz.quizId ? "bg-primary-50 dark:bg-primary-900/10 border-l-4 border-l-primary" : ""
                      }`}
                      onClick={() => setSelectedQuizId(quiz.quizId)}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                            <p className="font-bold truncate text-foreground">{quiz.quizName}</p>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                quiz.status === 'published' ? 'bg-success/20 text-success' :
                                quiz.status === 'testing' ? 'bg-warning/20 text-warning' : 'bg-default/20 text-default-600'
                            }`}>
                                {quiz.status}
                            </span>
                        </div>
                        <p className="text-xs text-default-600 font-bold uppercase tracking-wider">{quiz.questionsCount} Questions</p>
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Tooltip content="Edit Quiz Settings" color="foreground">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            className="text-default-600 hover:text-primary"
                            onClick={() => handleOpenEditQuiz(quiz)}
                          >
                            <Edit size={18} />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Delete Quiz" color="danger">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onClick={() => handleDeleteQuiz(quiz.quizId)}
                          >
                            <Trash2 size={18} />
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="lg:col-span-2 shadow-2xl border-none">
            {selectedQuizId ? (
              <div className="flex flex-col h-full w-full overflow-hidden">
                <CardHeader className="flex justify-between items-center px-6 pt-6 shrink-0">
                  <div className="min-w-0 pr-4">
                    <h2 className="text-2xl font-bold text-foreground truncate">{quizDetails?.quizName || "Loading..."}</h2>
                    <p className="text-medium text-default-600 font-medium mt-1 line-clamp-2">{quizDetails?.description || "No description provided."}</p>
                  </div>
                  {quizDetails?.coverImageUrl && (
                      <div className="shrink-0 h-16 w-24 border rounded-lg overflow-hidden bg-black/5">
                        <img 
                          src={quizDetails.coverImageUrl} 
                          alt="Quiz Cover" 
                          className="h-full w-full object-contain"
                        />
                      </div>
                  )}
                </CardHeader>
                <Divider className="my-4 mx-6 w-auto" />
                <CardBody className="px-6 pb-6 overflow-x-hidden">
                  <QuestionsManager quizId={selectedQuizId} />
                </CardBody>
              </div>
            ) : (
              <CardBody className="flex flex-col justify-center items-center h-96 text-default-500 gap-4">
                <div className="p-6 rounded-full bg-default-50">
                    <Edit size={48} />
                </div>
                <p className="text-lg font-bold">Select a quiz from the list to manage its content</p>
              </CardBody>
            )}
          </Card>
        </div>

        <Card className="shadow-2xl border-none mt-6">
          <CardHeader className="px-6 pt-6 pb-2">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Similarity Question Bank</h2>
              <p className="text-medium text-default-600 font-medium mt-1">
                Create standalone SIMILARITY questions with options (no quiz link, no correct answer).
              </p>
            </div>
          </CardHeader>
          <Divider className="my-4 mx-6 w-auto" />
          <CardBody className="px-6 pb-6 overflow-x-hidden">
            <QuestionsManager questionType="SIMILARITY" />
          </CardBody>
        </Card>
      </div>

      <Modal 
        isOpen={isQuizModalOpen} 
        onOpenChange={onQuizModalOpenChange} 
        size="lg"
        classNames={{
            base: "text-foreground",
            header: "border-b-[1px] border-default-100",
            footer: "border-t-[1px] border-default-100",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-xl font-bold">{quizModalMode === "create" ? "Create New Quiz" : "Edit Quiz Settings"}</ModalHeader>
              <ModalBody className="gap-4 pt-6">
                <Input
                  label="Quiz Title"
                  variant="bordered"
                  placeholder="Enter a catchy name for your quiz"
                  value={quizForm.quizName}
                  onChange={(e) => setQuizForm({ ...quizForm, quizName: e.target.value })}
                  isRequired
                  labelPlacement="outside"
                  classNames={{
                    label: "font-bold text-foreground",
                    input: "text-foreground",
                  }}
                />
                <Textarea
                  label="Description"
                  variant="bordered"
                  placeholder="What is this quiz about?"
                  value={quizForm.description}
                  onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                  labelPlacement="outside"
                  classNames={{
                    label: "font-bold text-foreground",
                    input: "text-foreground",
                  }}
                />
                
                <Select
                  label="Status"
                  variant="bordered"
                  labelPlacement="outside"
                  placeholder="Select quiz status"
                  selectedKeys={[quizForm.status]}
                  onSelectionChange={(keys) => setFormStatus(Array.from(keys)[0] as string)}
                  classNames={{
                    label: "font-bold text-foreground",
                    value: "text-foreground",
                  }}
                  popoverProps={{
                    className: "dark text-foreground"
                  }}
                >
                  <SelectItem key="draft">Draft</SelectItem>
                  <SelectItem key="published">Published</SelectItem>
                  <SelectItem key="testing">Testing</SelectItem>
                </Select>

                <div className="space-y-2">
                    <Input
                        label="Cover Image URL (Optional)"
                        variant="bordered"
                        placeholder="https://example.com/image.jpg"
                        value={quizForm.coverImageUrl}
                        onChange={(e) => setQuizForm({ ...quizForm, coverImageUrl: e.target.value })}
                        endContent={<ImageIcon size={18} className="text-default-400" />}
                        labelPlacement="outside"
                        classNames={{
                            label: "font-bold text-foreground",
                            input: "text-foreground",
                        }}
                    />
                    <FileUpload 
                        onUpload={(url) => setQuizForm({ ...quizForm, coverImageUrl: url })} 
                        label="Or upload cover image"
                        accept="image/*"
                        folder="quizzes"
                    />
                </div>
                {quizForm.coverImageUrl && (
                    <div className="mt-2 border rounded-xl overflow-hidden bg-black/5 h-40 flex items-center justify-center">
                        <img src={quizForm.coverImageUrl} className="h-full w-full object-contain" />
                    </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose} className="font-bold">
                  Cancel
                </Button>
                <Button color="primary" onPress={handleSubmitQuiz} className="font-bold shadow-md">
                  {quizModalMode === "create" ? "Create Quiz" : "Save Changes"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </section>
  );
}
