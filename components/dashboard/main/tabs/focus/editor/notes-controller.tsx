import { JSONContent, useEditor } from "novel";
import { useEffect } from "react";

interface NotesControllerProps {
    initialValue: JSONContent | null | undefined;
    setCurrentContent: (content: JSONContent) => void;
}

const NotesController = ({ initialValue, setCurrentContent }: NotesControllerProps) => {
    const { editor } = useEditor();

    if (!editor) return null;

    useEffect(() => {
        const { from, to } = editor.state.selection;
        editor.commands.setContent(initialValue ?? {});
        setCurrentContent(initialValue ?? {});
        editor.commands.setTextSelection({ from, to });
    }, [initialValue]);

    return (
        <div></div>
    );
};

export default NotesController;