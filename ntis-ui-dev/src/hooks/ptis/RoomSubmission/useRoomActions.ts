import { RoomWiseSubmissionProps, FloorData, RoomActions } from "@/types/room-details.types";
import { RoomSubmissionState } from "./useRoomSubmissionState";
import { useRoomInputActions } from "./useRoomInputActions";
import { useRoomEditActions } from "./useRoomEditActions";
import { useRoomListActions } from "./useRoomListActions";
import { useRoomPersistenceActions } from "./useRoomPersistenceActions";

/**
 * useRoomActions - Main orchestrator hook for room submission actions.
 * Decomposes complex logic into specialized sub-hooks for better maintainability.
 */
export const useRoomActions = (
  state: RoomSubmissionState, 
  props: RoomWiseSubmissionProps & { floorData?: FloorData }
): RoomActions => {
  const { availableRooms } = props;

  // 1. Input Handling & Validation
  const { handleInputChange } = useRoomInputActions(state, availableRooms ?? null);

  // 2. Edit Mode Lifecycle
  const { handleEdit, handleCancelEdit } = useRoomEditActions(state);

  // 3. Room List Operations (Add, Update, Delete)
  const { handleAddRoom, handleUpdateRoom, handleDelete } = useRoomListActions(state, props, handleCancelEdit, handleEdit);

  // 4. Final Submission & Persistence
  const { handleUpdate } = useRoomPersistenceActions(state, props);

  return {
    handleInputChange,
    handleEdit,
    handleCancelEdit,
    handleAddRoom,
    handleUpdateRoom,
    handleDelete,
    handleUpdate
  };
};
