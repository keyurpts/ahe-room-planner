export type RoomType = 'Kitchen' | 'Laundry' | 'Office' | 'Linen' | 'Garage' | 'Other';
export type RoomShape =
  'rectangle' | 'l-top-left' | 'l-top-right' | 'square' | 'l-bottom-right' | 'l-bottom-left';

export interface PlannerDraft {
  projectName: string;
  roomType: RoomType;
  shape: RoomShape;
}
