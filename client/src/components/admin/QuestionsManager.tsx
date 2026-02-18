import React, { useState } from "react";
import {
  Button,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Accordion,
  AccordionItem,
  Tooltip,
  Divider,
  Select,
  SelectItem,
  Input,
} from "@nextui-org/react";
import { Trash2, Edit, Plus, X, Image as ImageIcon, Music } from "lucide-react";
import {
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useGetQuizQuestionsQuery,
  useRemoveQuestionFromQuizMutation,
  useGetAllCategoriesQuery,
} from "../../store/api/quizzesApi";
import { QuizQuestion } from "../../types";
import { MediaPreview } from "./MediaPreview";
import { FileUpload } from "./FileUpload";
import { OptionsManager } from "./OptionsManager";

interface QuestionsManagerProps {
    quizId: number;
}

export function QuestionsManager({ quizId }: QuestionsManagerProps) {
  const { data: questions, isLoading } = useGetQuizQuestionsQuery(quizId);
  const { data: categories } = useGetAllCategoriesQuery();
  const [createQuestion] = useCreateQuestionMutation();
  const [updateQuestion] = useUpdateQuestionMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();
  const [removeQuestionFromQuiz] = useRemoveQuestionFromQuizMutation();

  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
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

  const handleOpenEdit = (q: QuizQuestion) => {
    setModalMode("edit");
    setForm({
      questionId: String(q.questionId),
      questionText: q.questionText,
      categoryId: String(q.categoryId || ""),
      imageUrl: q.imageUrl || "",
      audioUrl: q.audioUrl || "",
      difficulty: q.difficulty || "Medium"
    });
    onOpen();
  };

  const handleSubmit = async () => {
    try {
      if (modalMode === "create") {
        await createQuestion({ ...form, quizId: Number(quizId) } as any).unwrap();
      } else {
        await updateQuestion({ ...form, questionId: Number(form.questionId) } as any).unwrap();
      }
      onClose();
    } catch (err: any) {
        alert("Error: " + err.message);
    }
  };

  const handleDelete = async (qId: string | number) => {
    if (window.confirm("This will permanently delete the question from the entire database. Continue?")) {
        await deleteQuestion(Number(qId)).unwrap();
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
                key={q.questionId} 
                aria-label={q.questionText} 
                title={<div className="font-bold text-foreground pr-4 break-words">{q.questionText}</div>}
                subtitle={
                    <div className="flex gap-2 items-center mt-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            q.difficulty === 'Easy' ? 'bg-success-100 text-success-800 border border-success-200' :
                            q.difficulty === 'Hard' ? 'bg-danger-100 text-danger-800 border border-danger-200' :
                            'bg-warning-100 text-warning-800 border border-warning-200'
                        }`}>
                            {q.difficulty || 'Medium'}
                        </span>
                        {(q.imageUrl || q.audioUrl) && (
                            <div className="flex gap-2">
                                {q.imageUrl && <ImageIcon size={14} className="text-primary" />}
                                {q.audioUrl && <Music size={14} className="text-secondary" />}
                            </div>
                        )}
                    </div>
                }
                className="shadow-md border border-default-100 mb-4 overflow-hidden"
            >
              <div className="flex flex-col gap-6">
                <MediaPreview imageUrl={q.imageUrl} audioUrl={q.audioUrl} />
                <OptionsManager questionId={q.questionId} correctOptionId={q.correctOptionId} />
                
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
                                    removeQuestionFromQuiz({ quizId: Number(quizId), questionId: Number(q.questionId) });
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
                            onClick={() => handleDelete(q.questionId)}
                            className="font-bold flex-1"
                        >
                            Delete
                        </Button>
                    </div>
                </div>
              </div>
            </AccordionItem>
          )) || []}
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
                        {(categories || [])?.map((cat: CategoryDTO) => (
                            <SelectItem key={String(cat.categoryId)}>
                                {cat.categoryName}
                            </SelectItem>
                        ))}
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
