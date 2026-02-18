import React, { useState, useMemo, useRef, useEffect, ChangeEvent } from "react";
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
  Accordion,
  AccordionItem,
  Tooltip,
  Select,
  SelectItem,
} from "@nextui-org/react";
import {
  useGetAllQuizzesQuery,
  useCreateQuizMutation,
  useUpdateQuizMutation,
  useDeleteQuizMutation,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useGetOptionsByQuestionIdQuery,
  useCreateOptionMutation,
  useUpdateOptionMutation,
  useDeleteOptionMutation,
  useSetCorrectOptionMutation,
  useGetQuizByIdQuery,
  useGetQuizQuestionsQuery,
  useRemoveQuestionFromQuizMutation,
  useGetAllCategoriesQuery,
  useUploadMediaMutation,
} from "../store/api/quizzesApi";
import { Trash2, Edit, Plus, CheckCircle2, Circle, X, Image as ImageIcon, Music, Play, Pause, ExternalLink, Upload, Loader2 } from "lucide-react";
import NavbarComponent from "../components/ui/Navbar";
import supabase from "../utils/supabase";
import { useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression";
import { Quiz, Question, Option as QuizOption, Category } from "../types";

interface QuizForm {
  quizId?: string;
  quizName: string;
  description: string;
  coverImageUrl: string;
  status: string;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { data: quizzes, isLoading: loadingQuizzes } = useGetAllQuizzesQuery({ onlyValid: false, includeTesting: true });
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const { data: quizDetails } = useGetQuizByIdQuery(selectedQuizId || "", {
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
        q.quiz_name.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleOpenEditQuiz = (quiz: Quiz) => {
    setQuizModalMode("edit");
    setQuizForm({
      quizId: quiz.quiz_id,
      quizName: quiz.quiz_name,
      description: quiz.description || "",
      coverImageUrl: quiz.cover_image_url || "",
      status: quiz.status || "draft"
    });
    onQuizModalOpen();
  };

  const handleSubmitQuiz = async () => {
    try {
      if (quizModalMode === "create") {
        await createQuiz({
          quiz_name: quizForm.quizName,
          description: quizForm.description,
          cover_image_url: quizForm.coverImageUrl,
          status: quizForm.status as any
        }).unwrap();
      } else {
        await updateQuiz({
          quizId: quizForm.quizId || "",
          quiz_name: quizForm.quizName,
          description: quizForm.description,
          cover_image_url: quizForm.coverImageUrl,
          status: quizForm.status as any
        }).unwrap();
      }
      onQuizModalOpenChange(false);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (window.confirm("Are you sure you want to delete this quiz?")) {
      const deleteQuestions = window.confirm("Do you also want to delete all associated questions that aren't used in other quizzes?");
      await deleteQuiz({ quizId, deleteQuestions }).unwrap();
      if (selectedQuizId === quizId) setSelectedQuizId(null);
    }
  };

  return (
    <section className="min-h-screen bg-background text-foreground">
      <NavbarComponent isAdmin={true} />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Quiz Admin Panel</h1>
          <div className="flex gap-3">
            <Button 
                color="primary" 
                variant="solid"
                startContent={<Plus size={18} />} 
                onClick={handleOpenCreateQuiz}
                className="font-semibold shadow-lg"
            >
              New Quiz
            </Button>
            <Button color="danger" variant="flat" onClick={handleLogout} className="font-semibold">
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
                      key={quiz.quiz_id}
                      className={`p-4 border-b border-default-100 cursor-pointer hover:bg-default-50 flex justify-between items-center transition-all ${
                        selectedQuizId === quiz.quiz_id ? "bg-primary-50 dark:bg-primary-900/10 border-l-4 border-l-primary" : ""
                      }`}
                      onClick={() => setSelectedQuizId(quiz.quiz_id)}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                            <p className="font-bold truncate text-foreground">{quiz.quiz_name}</p>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                quiz.status === 'published' ? 'bg-success/20 text-success' :
                                quiz.status === 'testing' ? 'bg-warning/20 text-warning' : 'bg-default/20 text-default-600'
                            }`}>
                                {quiz.status}
                            </span>
                        </div>
                        <p className="text-xs text-default-600 font-bold uppercase tracking-wider">{quiz.questions_count} Questions</p>
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
                            onClick={() => handleDeleteQuiz(quiz.quiz_id)}
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
                    <h2 className="text-2xl font-bold text-foreground truncate">{quizDetails?.quiz_name || "Loading..."}</h2>
                    <p className="text-medium text-default-600 font-medium mt-1 line-clamp-2">{quizDetails?.description || "No description provided."}</p>
                  </div>
                  {quizDetails?.cover_image_url && (
                      <div className="shrink-0 h-16 w-24 border rounded-lg overflow-hidden bg-black/5">
                        <img 
                          src={quizDetails.cover_image_url} 
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
                  onSelectionChange={(keys) => setQuizForm({ ...quizForm, status: Array.from(keys)[0] as string })}
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

interface FileUploadProps {
    onUpload: (url: string) => void;
    label: string;
    accept?: string;
    folder?: string;
}

function FileUpload({ onUpload, label, accept = "*/*", folder = "misc" }: FileUploadProps) {
    const [uploadMedia, { isLoading }] = useUploadMediaMutation();
    const [compressionProgress, setCompressionProgress] = useState(0);
    const [isCompressing, setIsCompressing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        let file = e.target.files?.[0];
        if (!file) return;

        // Client-side compression for images
        if (file.type.startsWith("image/")) {
            setIsCompressing(true);
            setCompressionProgress(0);
            try {
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                    onProgress: (p: number) => setCompressionProgress(p),
                };
                file = await imageCompression(file, options);
            } catch (error) {
                console.error("Compression error:", error);
            } finally {
                setIsCompressing(false);
            }
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        try {
            const result: any = await uploadMedia(formData).unwrap();
            onUpload(result.url);
        } catch (err: any) {
            alert("Upload failed: " + (err.data?.message || err.error));
        }
    };

    return (
        <div className="flex flex-col gap-1">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept={accept}
            />
            <div className="flex items-center gap-2">
                <Button 
                    size="sm" 
                    variant="flat" 
                    color="secondary" 
                    startContent={(isLoading || isCompressing) ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                    onClick={() => fileInputRef.current?.click()}
                    isLoading={isLoading || isCompressing}
                    className="w-fit font-bold"
                >
                    {isCompressing ? `Compressing ${compressionProgress}%...` : label}
                </Button>
            </div>
        </div>
    );
}

interface QuestionsManagerProps {
    quizId: string;
}

function QuestionsManager({ quizId }: QuestionsManagerProps) {
  const { data: questions, isLoading } = useGetQuizQuestionsQuery(quizId);
  const { data: categories } = useGetAllCategoriesQuery();
  const [createQuestion] = useCreateQuestionMutation();
  const [updateQuestion] = useUpdateQuestionMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();
  const [removeQuestionFromQuiz] = useRemoveQuestionFromQuizMutation();

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState({ 
    questionId: "",
    questionText: "", 
    categoryId: "", 
    imageUrl: "", 
    audioUrl: "", 
    difficulty: "Medium" 
  });

  const handleOpenCreate = () => {
    setModalMode("create");
    setForm({ questionId: "", questionText: "", categoryId: "", imageUrl: "", audioUrl: "", difficulty: "Medium" });
    onOpen();
  };

  const handleOpenEdit = (q: Question) => {
    setModalMode("edit");
    setForm({
      questionId: q.questionId || q.question_id,
      questionText: q.questionText || q.question_text,
      categoryId: String(q.categoryId || ""),
      imageUrl: q.imageUrl || q.media_url || "",
      audioUrl: q.audioUrl || "",
      difficulty: q.difficulty || "Medium"
    });
    onOpen();
  };

  const handleSubmit = async () => {
    try {
      if (modalMode === "create") {
        await createQuestion({ ...form, quizId } as any).unwrap();
      } else {
        await updateQuestion(form as any).unwrap();
      }
      onOpenChange(false);
    } catch (err: any) {
        alert("Error: " + err.message);
    }
  };

  const handleDelete = async (qId: string) => {
    if (window.confirm("This will permanently delete the question from the entire database. Continue?")) {
        await deleteQuestion(qId).unwrap();
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-foreground">Questions</h3>
        <Button 
            size="md" 
            color="primary" 
            variant="solid"
            startContent={<Plus size={18} />} 
            onClick={handleOpenCreate}
            className="font-bold shadow-md"
        >
          Add Question
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-12 text-foreground font-medium">Loading questions...</div>
      ) : questions?.length === 0 ? (
          <div className="text-center py-12 bg-default-50 rounded-2xl border-2 border-dashed border-default-200">
              <p className="text-default-600 font-bold">No questions in this quiz yet.</p>
          </div>
      ) : (
        <Accordion variant="splitted" selectionMode="multiple" className="px-0 w-full" itemClasses={{ base: "w-full" }}>
          {questions?.map((q) => (
            <AccordionItem 
                key={q.questionId || q.question_id} 
                aria-label={q.questionText || q.question_text} 
                title={<div className="font-bold text-foreground pr-4 break-words">{q.questionText || q.question_text}</div>}
                subtitle={
                    <div className="flex gap-2 items-center mt-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            q.difficulty === 'Easy' ? 'bg-success-100 text-success-800 border border-success-200' :
                            q.difficulty === 'Hard' ? 'bg-danger-100 text-danger-800 border border-danger-200' :
                            'bg-warning-100 text-warning-800 border border-warning-200'
                        }`}>
                            {q.difficulty || 'Medium'}
                        </span>
                        {(q.imageUrl || q.media_url || q.audioUrl) && (
                            <div className="flex gap-2">
                                {(q.imageUrl || q.media_url) && <ImageIcon size={14} className="text-primary" />}
                                {q.audioUrl && <Music size={14} className="text-secondary" />}
                            </div>
                        )}
                    </div>
                }
                className="shadow-md border border-default-100 mb-4 overflow-hidden"
            >
              <div className="flex flex-col gap-6">
                <MediaPreview imageUrl={q.imageUrl || q.media_url} audioUrl={q.audioUrl} />
                <OptionsManager questionId={q.questionId || q.question_id} correctOptionId={q.correctOptionId} />
                
                <Divider />
                <div className="flex flex-col xs:flex-row justify-between items-stretch xs:items-center bg-default-50 p-4 gap-4">
                    <Tooltip content="Remove from this quiz only" color="foreground">
                        <Button 
                            size="md" 
                            color="warning" 
                            variant="flat" 
                            startContent={<X size={18} />} 
                            onClick={() => {
                                if(window.confirm("Remove this question from this quiz?")) {
                                    removeQuestionFromQuiz({ quizId, questionId: q.questionId || q.question_id });
                                }
                            }}
                            className="font-bold flex-1 xs:flex-initial"
                        >
                            Remove from Quiz
                        </Button>
                    </Tooltip>
                    
                    <div className="flex gap-3 flex-1 xs:flex-initial">
                        <Button 
                            size="md" 
                            variant="solid" 
                            color="primary"
                            startContent={<Edit size={18} />} 
                            onClick={() => handleOpenEdit(q)}
                            className="font-bold flex-1"
                        >
                            Edit
                        </Button>
                        <Button 
                            size="md" 
                            color="danger" 
                            variant="flat" 
                            startContent={<Trash2 size={18} />} 
                            onClick={() => handleDelete(q.questionId || q.question_id)}
                            className="font-bold flex-1"
                        >
                            Delete
                        </Button>
                    </div>
                </div>
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        size="2xl"
        classNames={{
            base: "text-foreground",
            header: "border-b-[1px] border-default-100",
            footer: "border-t-[1px] border-default-100",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-xl font-bold">{modalMode === "create" ? "Add New Question" : "Edit Question Details"}</ModalHeader>
              <ModalBody className="gap-6 pt-6">
                <Textarea
                  label="Question Text"
                  variant="bordered"
                  placeholder="What is the question?"
                  value={form.questionText}
                  onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                  isRequired
                  labelPlacement="outside"
                  classNames={{
                    label: "font-bold text-foreground",
                    input: "text-foreground",
                  }}
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <Select 
                        label="Difficulty" 
                        variant="bordered"
                        selectedKeys={[form.difficulty]}
                        onSelectionChange={(keys) => setForm({ ...form, difficulty: Array.from(keys)[0] as string })}
                        labelPlacement="outside"
                        classNames={{
                            label: "font-bold text-foreground",
                            value: "text-foreground",
                        }}
                        popoverProps={{
                            className: "dark text-foreground"
                        }}
                    >
                        <SelectItem key="Easy">Easy</SelectItem>
                        <SelectItem key="Medium">Medium</SelectItem>
                        <SelectItem key="Hard">Hard</SelectItem>
                    </Select>
                    
                    <Select 
                        label="Category" 
                        variant="bordered"
                        placeholder="Select category"
                        selectedKeys={form.categoryId ? [form.categoryId] : []}
                        onSelectionChange={(keys) => setForm({ ...form, categoryId: Array.from(keys)[0] as string })}
                        labelPlacement="outside"
                        classNames={{
                            label: "font-bold text-foreground",
                            value: "text-foreground",
                        }}
                        popoverProps={{
                            className: "dark text-foreground"
                        }}
                    >
                        {(categories as any[])?.map((cat) => (
                            <SelectItem key={String(cat.category_id)}>
                                {cat.category_name}
                            </SelectItem>
                        )) || []}
                    </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <Input
                            label="Image URL (Optional)"
                            variant="bordered"
                            placeholder="https://..."
                            value={form.imageUrl}
                            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                            endContent={<ImageIcon size={18} className="text-default-400" />}
                            labelPlacement="outside"
                            classNames={{
                                label: "font-bold text-foreground",
                                input: "text-foreground",
                            }}
                        />
                        <FileUpload 
                            onUpload={(url) => setForm({ ...form, imageUrl: url })} 
                            label="Upload Image"
                            accept="image/*"
                            folder="questions"
                        />
                    </div>
                    <div className="space-y-3">
                        <Input
                            label="Audio URL (Optional)"
                            variant="bordered"
                            placeholder="https://..."
                            value={form.audioUrl}
                            onChange={(e) => setForm({ ...form, audioUrl: e.target.value })}
                            endContent={<Music size={18} className="text-default-400" />}
                            labelPlacement="outside"
                            classNames={{
                                label: "font-bold text-foreground",
                                input: "text-foreground",
                            }}
                        />
                        <FileUpload 
                            onUpload={(url) => setForm({ ...form, audioUrl: url })} 
                            label="Upload Audio"
                            accept="audio/*"
                            folder="questions"
                        />
                    </div>
                </div>

                {(form.imageUrl || form.audioUrl) && (
                    <div className="border-2 border-dashed border-default-200 p-4 rounded-2xl bg-black/5">
                        <p className="text-xs font-bold uppercase text-default-600 mb-3 tracking-widest">Media Preview</p>
                        <MediaPreview imageUrl={form.imageUrl} audioUrl={form.audioUrl} />
                    </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose} className="font-bold">
                  Cancel
                </Button>
                <Button color="primary" onPress={handleSubmit} className="font-bold shadow-md">
                  {modalMode === "create" ? "Add Question" : "Save Changes"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

interface OptionsManagerProps {
    questionId: string;
    correctOptionId?: string | number;
}

function OptionsManager({ questionId, correctOptionId }: OptionsManagerProps) {
  const { data: options, isLoading } = useGetOptionsByQuestionIdQuery(questionId);
  const [createOption] = useCreateOptionMutation();
  const [updateOption] = useUpdateOptionMutation();
  const [deleteOption] = useDeleteOptionMutation();
  const [setCorrectOption] = useSetCorrectOptionMutation();

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState({ optionId: "", optionText: "", imageUrl: "", audioUrl: "" });

  const handleOpenCreate = () => {
    setModalMode("create");
    setForm({ optionId: "", optionText: "", imageUrl: "", audioUrl: "" });
    onOpen();
  };

  const handleOpenEdit = (opt: QuizOption) => {
    setModalMode("edit");
    setForm({
      optionId: opt.option_id,
      optionText: opt.option_text || opt.optionText || "",
      imageUrl: opt.image_url || "",
      audioUrl: opt.audio_url || ""
    });
    onOpen();
  };

  const handleSubmit = async () => {
    try {
      if (modalMode === "create") {
        await createOption({ questionId, option_text: form.optionText, image_url: form.imageUrl, audio_url: form.audioUrl }).unwrap();
      } else {
        await updateOption({ optionId: form.optionId, option_text: form.optionText, image_url: form.imageUrl, audio_url: form.audioUrl }).unwrap();
      }
      onOpenChange(false);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (optId: string) => {
    if (window.confirm("Delete this option?")) {
      await deleteOption(optId).unwrap();
    }
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-default-600">Answer Options</span>
        <Button 
            size="sm" 
            variant="flat" 
            color="primary"
            startContent={<Plus size={14} />} 
            onClick={handleOpenCreate}
            className="font-bold"
        >
          Add Option
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
            <div className="col-span-2 text-center text-default-600 font-medium py-4">Loading options...</div>
        ) : options?.length === 0 ? (
            <div className="col-span-2 text-center text-default-600 font-bold py-6 bg-default-50 rounded-xl border-2 border-dashed border-default-100">No options defined yet.</div>
        ) : options?.map((opt) => (
          <div 
            key={opt.option_id} 
            className={`flex flex-col p-4 rounded-xl border-2 transition-all ${
                Number(correctOptionId) === Number(opt.option_id) 
                ? "bg-success-50 border-success shadow-sm" 
                : "bg-default-50 border-transparent hover:border-default-200"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                    <Tooltip content={Number(correctOptionId) === Number(opt.option_id) ? "Correct Answer" : "Mark as Correct"} color="foreground">
                        <div 
                            className="cursor-pointer group shrink-0"
                            onClick={() => setCorrectOption({ questionId, optionId: opt.option_id })}
                        >
                            {Number(correctOptionId) === Number(opt.option_id) ? (
                                <CheckCircle2 size={24} className="text-success fill-success/10" />
                            ) : (
                                <Circle size={24} className="text-default-400 group-hover:text-primary transition-colors" />
                            )}
                        </div>
                    </Tooltip>
                    <span className={`font-bold text-sm truncate ${Number(correctOptionId) === Number(opt.option_id) ? "text-success-800" : "text-foreground"}`}>
                        {opt.option_text || "Image/Audio Answer"}
                    </span>
                </div>
                <div className="flex gap-1 shrink-0">
                    <Button isIconOnly size="sm" variant="light" className="text-default-600" onClick={() => handleOpenEdit(opt)}>
                        <Edit size={16} />
                    </Button>
                    <Button isIconOnly size="sm" variant="light" color="danger" onClick={() => handleDelete(opt.option_id)}>
                        <Trash2 size={16} />
                    </Button>
                </div>
            </div>
            {(opt.image_url || opt.audio_url) && (
                <div className="mt-1">
                    <MediaPreview imageUrl={opt.image_url} audioUrl={opt.audio_url} compact />
                </div>
            )}
          </div>
        ))}
      </div>

      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        classNames={{
            base: "text-foreground",
            header: "border-b-[1px] border-default-100",
            footer: "border-t-[1px] border-default-100",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="font-bold">{modalMode === "create" ? "Add New Option" : "Edit Option"}</ModalHeader>
              <ModalBody className="gap-4 pt-6">
                <Input
                  label="Option Text"
                  variant="bordered"
                  placeholder="Enter answer text"
                  value={form.optionText}
                  onChange={(e) => setForm({ ...form, optionText: e.target.value })}
                  labelPlacement="outside"
                  classNames={{
                    label: "font-bold text-foreground",
                    input: "text-foreground",
                  }}
                />
                <div className="grid grid-cols-1 gap-6 mt-2">
                    <div className="space-y-2">
                        <Input
                            label="Image URL (Optional)"
                            variant="bordered"
                            placeholder="https://..."
                            value={form.imageUrl}
                            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                            labelPlacement="outside"
                            classNames={{
                                label: "font-bold text-foreground",
                                input: "text-foreground",
                            }}
                        />
                        <FileUpload 
                            onUpload={(url) => setForm({ ...form, imageUrl: url })} 
                            label="Upload Image"
                            accept="image/*"
                            folder="options"
                        />
                    </div>
                    <div className="space-y-2">
                        <Input
                            label="Audio URL (Optional)"
                            variant="bordered"
                            placeholder="https://..."
                            value={form.audioUrl}
                            onChange={(e) => setForm({ ...form, audioUrl: e.target.value })}
                            labelPlacement="outside"
                            classNames={{
                                label: "font-bold text-foreground",
                                input: "text-foreground",
                            }}
                        />
                        <FileUpload 
                            onUpload={(url) => setForm({ ...form, audioUrl: url })} 
                            label="Upload Audio"
                            accept="audio/*"
                            folder="options"
                        />
                    </div>
                </div>
                {(form.imageUrl || form.audioUrl) && (
                    <div className="p-3 border-2 border-dashed border-default-200 rounded-xl bg-black/5">
                        <MediaPreview imageUrl={form.imageUrl} audioUrl={form.audioUrl} compact />
                    </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose} className="font-bold">
                  Cancel
                </Button>
                <Button color="primary" onPress={handleSubmit} className="font-bold shadow-md">
                  {modalMode === "create" ? "Add Option" : "Save Changes"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

interface MediaPreviewProps {
    imageUrl?: string;
    audioUrl?: string;
    compact?: boolean;
}

function MediaPreview({ imageUrl, audioUrl, compact = false }: MediaPreviewProps) {
    if (!imageUrl && !audioUrl) return null;

    return (
        <div className={`flex flex-col gap-3 ${compact ? "" : "w-full"}`}>
            {imageUrl && (
                <div className={`relative group rounded-xl overflow-hidden bg-black/5 flex justify-center items-center ${compact ? "h-32" : "h-64"}`}>
                    <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="h-full w-full object-contain"
                    />
                    <a 
                        href={imageUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ExternalLink size={14} />
                    </a>
                </div>
            )}
            {audioUrl && (
                <AudioPlayer audioUrl={audioUrl} compact={compact} />
            )}
        </div>
    );
}

interface AudioPlayerProps {
    audioUrl: string;
    compact?: boolean;
}

function AudioPlayer({ audioUrl, compact }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => setIsPlaying(false);
        
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [audioUrl]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(err => console.error("Audio playback failed", err));
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className={`flex items-center gap-3 bg-default-100 p-2 rounded-xl border-2 border-default-200 ${compact ? "py-1.5" : ""}`}>
            <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                <Music size={compact ? 16 : 20} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase text-default-600 leading-none mb-1 tracking-wider">Audio Source</p>
                <p className="text-xs truncate font-bold text-foreground/80">{audioUrl}</p>
            </div>
            <Button 
                isIconOnly 
                size="sm" 
                variant="solid" 
                color={isPlaying ? "secondary" : "primary"}
                onClick={togglePlay}
                className="shrink-0 shadow-sm"
            >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </Button>
        </div>
    );
}
