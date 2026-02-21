import React, { useState } from "react";
import {
  Button,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Tooltip,
} from "@nextui-org/react";
import { Trash2, Edit, Plus, CheckCircle2, Circle } from "lucide-react";
import {
  useGetOptionsByQuestionIdQuery,
  useCreateOptionMutation,
  useUpdateOptionMutation,
  useDeleteOptionMutation,
  useSetCorrectOptionMutation,
} from "../../store/api/quizzesApi";
import { QuizOption } from "../../types";
import { MediaPreview } from "./MediaPreview";
import { FileUpload } from "./FileUpload";

interface OptionsManagerProps {
    questionId: number;
    correctOptionId?: number;
    canSetCorrect?: boolean;
}

export function OptionsManager({ questionId, correctOptionId, canSetCorrect = true }: OptionsManagerProps) {
  const { data: options, isLoading } = useGetOptionsByQuestionIdQuery(questionId);
  const [createOption] = useCreateOptionMutation();
  const [updateOption] = useUpdateOptionMutation();
  const [deleteOption] = useDeleteOptionMutation();
  const [setCorrectOption] = useSetCorrectOptionMutation();

  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
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
      optionId: String(opt.optionId),
      optionText: opt.optionText || "",
      imageUrl: opt.imageUrl || "",
      audioUrl: opt.audioUrl || ""
    });
    onOpen();
  };

  const handleSubmit = async () => {
    try {
      if (modalMode === "create") {
        await createOption({ 
          questionId: Number(questionId), 
          optionText: form.optionText, 
          imageUrl: form.imageUrl, 
          audioUrl: form.audioUrl 
        } as any).unwrap();
      } else {
        await updateOption({ 
          optionId: Number(form.optionId), 
          optionText: form.optionText, 
          imageUrl: form.imageUrl, 
          audioUrl: form.audioUrl 
        } as any).unwrap();
      }
      onClose();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (optId: number) => {
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
            key={opt.optionId} 
            className={`flex flex-col p-4 rounded-xl border-2 transition-all ${
                Number(correctOptionId) === Number(opt.optionId) 
                ? "bg-success-50 border-success shadow-sm" 
                : "bg-default-50 border-transparent hover:border-default-200"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                    {canSetCorrect ? (
                      <Tooltip content={Number(correctOptionId) === Number(opt.optionId) ? "Correct Answer" : "Mark as Correct"} color="foreground">
                          <div 
                              className="cursor-pointer group shrink-0"
                              onClick={() => setCorrectOption({ questionId: Number(questionId), optionId: Number(opt.optionId) })}
                          >
                              {Number(correctOptionId) === Number(opt.optionId) ? (
                                  <CheckCircle2 size={24} className="text-success fill-success/10" />
                              ) : (
                                  <Circle size={24} className="text-default-400 group-hover:text-primary transition-colors" />
                              )}
                          </div>
                      </Tooltip>
                    ) : (
                      <div className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-secondary/20 text-secondary">
                        Similarity
                      </div>
                    )}
                    <span className={`font-bold text-sm truncate ${Number(correctOptionId) === Number(opt.optionId) ? "text-success-800" : "text-foreground"}`}>
                        {opt.optionText || "Image/Audio Answer"}
                    </span>
                </div>
                <div className="flex gap-1 shrink-0">
                    <Button isIconOnly size="sm" variant="light" className="text-default-600" onClick={() => handleOpenEdit(opt)}>
                        <Edit size={16} />
                    </Button>
                    <Button isIconOnly size="sm" variant="light" color="danger" onClick={() => handleDelete(opt.optionId)}>
                        <Trash2 size={16} />
                    </Button>
                </div>
            </div>
            {(opt.imageUrl || opt.audioUrl) && (
                <div className="mt-1">
                    <MediaPreview imageUrl={opt.imageUrl} audioUrl={opt.audioUrl} compact />
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
