export interface PaginatedResponse<T> {
  data: {
    data: T[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    meta: {
      page: number;
      pageCount: number;
      hasPrevPage: boolean;
      hasNextPage: boolean;
      limit: number;
      itemCount: number;
    };
  };
}

export interface GetParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  isArchived?: boolean;
  isDeleted?: boolean;
  sortBy?: string;
}
