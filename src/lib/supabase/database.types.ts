export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      AttendanceRecord: {
        Row: {
          attendanceSessionId: string
          createdAt: string
          excused: boolean
          id: string
          remarks: string | null
          status: Database["public"]["Enums"]["AttendanceStatus"]
          studentId: string
          updatedAt: string
        }
        Insert: {
          attendanceSessionId: string
          createdAt?: string
          excused?: boolean
          id: string
          remarks?: string | null
          status: Database["public"]["Enums"]["AttendanceStatus"]
          studentId: string
          updatedAt: string
        }
        Update: {
          attendanceSessionId?: string
          createdAt?: string
          excused?: boolean
          id?: string
          remarks?: string | null
          status?: Database["public"]["Enums"]["AttendanceStatus"]
          studentId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "AttendanceRecord_attendanceSessionId_fkey"
            columns: ["attendanceSessionId"]
            isOneToOne: false
            referencedRelation: "AttendanceSession"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AttendanceRecord_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "Student"
            referencedColumns: ["id"]
          },
        ]
      }
      AttendanceSession: {
        Row: {
          classId: string
          createdAt: string
          id: string
          markedByCoachId: string | null
          sessionDate: string
          submittedAt: string | null
          updatedAt: string
        }
        Insert: {
          classId: string
          createdAt?: string
          id: string
          markedByCoachId?: string | null
          sessionDate: string
          submittedAt?: string | null
          updatedAt: string
        }
        Update: {
          classId?: string
          createdAt?: string
          id?: string
          markedByCoachId?: string | null
          sessionDate?: string
          submittedAt?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "AttendanceSession_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "Class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AttendanceSession_markedByCoachId_fkey"
            columns: ["markedByCoachId"]
            isOneToOne: false
            referencedRelation: "Coach"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AttendanceSession_markedByCoachId_fkey"
            columns: ["markedByCoachId"]
            isOneToOne: false
            referencedRelation: "coach_public"
            referencedColumns: ["id"]
          },
        ]
      }
      CheckIn: {
        Row: {
          checkedInAt: string
          checkInDate: string
          coachShiftId: string
          id: string
          studentId: string
          venueId: string
        }
        Insert: {
          checkedInAt?: string
          checkInDate: string
          coachShiftId: string
          id: string
          studentId: string
          venueId: string
        }
        Update: {
          checkedInAt?: string
          checkInDate?: string
          coachShiftId?: string
          id?: string
          studentId?: string
          venueId?: string
        }
        Relationships: [
          {
            foreignKeyName: "CheckIn_coachShiftId_fkey"
            columns: ["coachShiftId"]
            isOneToOne: false
            referencedRelation: "CoachShift"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CheckIn_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "Student"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CheckIn_venueId_fkey"
            columns: ["venueId"]
            isOneToOne: false
            referencedRelation: "Venue"
            referencedColumns: ["id"]
          },
        ]
      }
      CheckInNotification: {
        Row: {
          checkInId: string
          delivered: boolean
          id: string
          message: string
          recipientPhone: string | null
          sentAt: string
          studentId: string
        }
        Insert: {
          checkInId: string
          delivered: boolean
          id: string
          message: string
          recipientPhone?: string | null
          sentAt?: string
          studentId: string
        }
        Update: {
          checkInId?: string
          delivered?: boolean
          id?: string
          message?: string
          recipientPhone?: string | null
          sentAt?: string
          studentId?: string
        }
        Relationships: [
          {
            foreignKeyName: "CheckInNotification_checkInId_fkey"
            columns: ["checkInId"]
            isOneToOne: false
            referencedRelation: "CheckIn"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CheckInNotification_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "Student"
            referencedColumns: ["id"]
          },
        ]
      }
      Class: {
        Row: {
          createdAt: string
          dayOfWeek: Database["public"]["Enums"]["DayOfWeek"]
          durationMinutes: number
          id: string
          level: Database["public"]["Enums"]["Level"]
          startTime: string
          subject: Database["public"]["Enums"]["Subject"]
          venueId: string
        }
        Insert: {
          createdAt?: string
          dayOfWeek: Database["public"]["Enums"]["DayOfWeek"]
          durationMinutes?: number
          id: string
          level: Database["public"]["Enums"]["Level"]
          startTime: string
          subject: Database["public"]["Enums"]["Subject"]
          venueId: string
        }
        Update: {
          createdAt?: string
          dayOfWeek?: Database["public"]["Enums"]["DayOfWeek"]
          durationMinutes?: number
          id?: string
          level?: Database["public"]["Enums"]["Level"]
          startTime?: string
          subject?: Database["public"]["Enums"]["Subject"]
          venueId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Class_venueId_fkey"
            columns: ["venueId"]
            isOneToOne: false
            referencedRelation: "Venue"
            referencedColumns: ["id"]
          },
        ]
      }
      ClassAssignment: {
        Row: {
          assignedAt: string
          classId: string
          coachId: string
          id: string
        }
        Insert: {
          assignedAt?: string
          classId: string
          coachId: string
          id: string
        }
        Update: {
          assignedAt?: string
          classId?: string
          coachId?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ClassAssignment_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "Class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ClassAssignment_coachId_fkey"
            columns: ["coachId"]
            isOneToOne: false
            referencedRelation: "Coach"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ClassAssignment_coachId_fkey"
            columns: ["coachId"]
            isOneToOne: false
            referencedRelation: "coach_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ClassProgress: {
        Row: {
          classId: string
          completedDate: string | null
          createdAt: string
          curriculumTopicId: string
          id: string
          notes: string | null
          plannedDate: string
          status: Database["public"]["Enums"]["ProgressStatus"]
          updatedAt: string
        }
        Insert: {
          classId: string
          completedDate?: string | null
          createdAt?: string
          curriculumTopicId: string
          id: string
          notes?: string | null
          plannedDate: string
          status?: Database["public"]["Enums"]["ProgressStatus"]
          updatedAt: string
        }
        Update: {
          classId?: string
          completedDate?: string | null
          createdAt?: string
          curriculumTopicId?: string
          id?: string
          notes?: string | null
          plannedDate?: string
          status?: Database["public"]["Enums"]["ProgressStatus"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "ClassProgress_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "Class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ClassProgress_curriculumTopicId_fkey"
            columns: ["curriculumTopicId"]
            isOneToOne: false
            referencedRelation: "CurriculumTopic"
            referencedColumns: ["id"]
          },
        ]
      }
      Coach: {
        Row: {
          authUserId: string | null
          createdAt: string
          email: string
          failedLoginAttempts: number
          id: string
          isAdmin: boolean
          lockedUntil: string | null
          name: string
          passwordHash: string
          phone: string | null
          trainingCompletedAt: string | null
        }
        Insert: {
          authUserId?: string | null
          createdAt?: string
          email: string
          failedLoginAttempts?: number
          id: string
          isAdmin?: boolean
          lockedUntil?: string | null
          name: string
          passwordHash: string
          phone?: string | null
          trainingCompletedAt?: string | null
        }
        Update: {
          authUserId?: string | null
          createdAt?: string
          email?: string
          failedLoginAttempts?: number
          id?: string
          isAdmin?: boolean
          lockedUntil?: string | null
          name?: string
          passwordHash?: string
          phone?: string | null
          trainingCompletedAt?: string | null
        }
        Relationships: []
      }
      CoachShift: {
        Row: {
          approvedAt: string | null
          approvedByCoachId: string | null
          clockInAt: string
          clockOutAt: string | null
          coachId: string
          createdAt: string
          id: string
          reviewNote: string | null
          shiftBlock: Database["public"]["Enums"]["ShiftBlock"]
          shiftDate: string
          status: Database["public"]["Enums"]["CoachShiftStatus"]
          updatedAt: string
          venueId: string
        }
        Insert: {
          approvedAt?: string | null
          approvedByCoachId?: string | null
          clockInAt: string
          clockOutAt?: string | null
          coachId: string
          createdAt?: string
          id: string
          reviewNote?: string | null
          shiftBlock: Database["public"]["Enums"]["ShiftBlock"]
          shiftDate: string
          status?: Database["public"]["Enums"]["CoachShiftStatus"]
          updatedAt: string
          venueId: string
        }
        Update: {
          approvedAt?: string | null
          approvedByCoachId?: string | null
          clockInAt?: string
          clockOutAt?: string | null
          coachId?: string
          createdAt?: string
          id?: string
          reviewNote?: string | null
          shiftBlock?: Database["public"]["Enums"]["ShiftBlock"]
          shiftDate?: string
          status?: Database["public"]["Enums"]["CoachShiftStatus"]
          updatedAt?: string
          venueId?: string
        }
        Relationships: [
          {
            foreignKeyName: "CoachShift_approvedByCoachId_fkey"
            columns: ["approvedByCoachId"]
            isOneToOne: false
            referencedRelation: "Coach"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CoachShift_approvedByCoachId_fkey"
            columns: ["approvedByCoachId"]
            isOneToOne: false
            referencedRelation: "coach_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CoachShift_coachId_fkey"
            columns: ["coachId"]
            isOneToOne: false
            referencedRelation: "Coach"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CoachShift_coachId_fkey"
            columns: ["coachId"]
            isOneToOne: false
            referencedRelation: "coach_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CoachShift_venueId_fkey"
            columns: ["venueId"]
            isOneToOne: false
            referencedRelation: "Venue"
            referencedColumns: ["id"]
          },
        ]
      }
      CurriculumTopic: {
        Row: {
          conceptExplanation: string | null
          createdAt: string
          description: string | null
          diagramSpec: string | null
          id: string
          level: Database["public"]["Enums"]["Level"]
          order: number
          strand: string | null
          subject: Database["public"]["Enums"]["Subject"]
          teachingSteps: string | null
          title: string
          workedExamples: string | null
        }
        Insert: {
          conceptExplanation?: string | null
          createdAt?: string
          description?: string | null
          diagramSpec?: string | null
          id: string
          level: Database["public"]["Enums"]["Level"]
          order: number
          strand?: string | null
          subject: Database["public"]["Enums"]["Subject"]
          teachingSteps?: string | null
          title: string
          workedExamples?: string | null
        }
        Update: {
          conceptExplanation?: string | null
          createdAt?: string
          description?: string | null
          diagramSpec?: string | null
          id?: string
          level?: Database["public"]["Enums"]["Level"]
          order?: number
          strand?: string | null
          subject?: Database["public"]["Enums"]["Subject"]
          teachingSteps?: string | null
          title?: string
          workedExamples?: string | null
        }
        Relationships: []
      }
      Enrollment: {
        Row: {
          classId: string
          enrolledAt: string
          id: string
          status: Database["public"]["Enums"]["EnrollmentStatus"]
          studentId: string
        }
        Insert: {
          classId: string
          enrolledAt?: string
          id: string
          status?: Database["public"]["Enums"]["EnrollmentStatus"]
          studentId: string
        }
        Update: {
          classId?: string
          enrolledAt?: string
          id?: string
          status?: Database["public"]["Enums"]["EnrollmentStatus"]
          studentId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Enrollment_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "Class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Enrollment_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "Student"
            referencedColumns: ["id"]
          },
        ]
      }
      GuardianNotification: {
        Row: {
          classId: string
          delivered: boolean
          id: string
          message: string
          recipientPhone: string | null
          sentAt: string
          sessionDate: string
          status: Database["public"]["Enums"]["AttendanceStatus"]
          studentId: string
        }
        Insert: {
          classId: string
          delivered: boolean
          id: string
          message: string
          recipientPhone?: string | null
          sentAt?: string
          sessionDate: string
          status: Database["public"]["Enums"]["AttendanceStatus"]
          studentId: string
        }
        Update: {
          classId?: string
          delivered?: boolean
          id?: string
          message?: string
          recipientPhone?: string | null
          sentAt?: string
          sessionDate?: string
          status?: Database["public"]["Enums"]["AttendanceStatus"]
          studentId?: string
        }
        Relationships: [
          {
            foreignKeyName: "GuardianNotification_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "Class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "GuardianNotification_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "Student"
            referencedColumns: ["id"]
          },
        ]
      }
      Student: {
        Row: {
          authUserId: string | null
          contactNumber: string
          email: string
          emergencyContactName: string
          emergencyContactPhone: string
          emergencyContactRelationship: Database["public"]["Enums"]["EmergencyContactRelationship"]
          id: string
          isMapStudent: boolean
          level: Database["public"]["Enums"]["Level"]
          loginCode: string
          name: string
          referralSource: Database["public"]["Enums"]["ReferralSource"] | null
          registeredAt: string
          schoolName: string
          status: Database["public"]["Enums"]["StudentStatus"]
        }
        Insert: {
          authUserId?: string | null
          contactNumber: string
          email: string
          emergencyContactName: string
          emergencyContactPhone: string
          emergencyContactRelationship: Database["public"]["Enums"]["EmergencyContactRelationship"]
          id: string
          isMapStudent?: boolean
          level: Database["public"]["Enums"]["Level"]
          loginCode: string
          name: string
          referralSource?: Database["public"]["Enums"]["ReferralSource"] | null
          registeredAt?: string
          schoolName: string
          status?: Database["public"]["Enums"]["StudentStatus"]
        }
        Update: {
          authUserId?: string | null
          contactNumber?: string
          email?: string
          emergencyContactName?: string
          emergencyContactPhone?: string
          emergencyContactRelationship?: Database["public"]["Enums"]["EmergencyContactRelationship"]
          id?: string
          isMapStudent?: boolean
          level?: Database["public"]["Enums"]["Level"]
          loginCode?: string
          name?: string
          referralSource?: Database["public"]["Enums"]["ReferralSource"] | null
          registeredAt?: string
          schoolName?: string
          status?: Database["public"]["Enums"]["StudentStatus"]
        }
        Relationships: []
      }
      Venue: {
        Row: {
          address: string | null
          createdAt: string
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          createdAt?: string
          id: string
          name: string
        }
        Update: {
          address?: string | null
          createdAt?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      coach_public: {
        Row: {
          id: string | null
          isAdmin: boolean | null
          name: string | null
        }
        Insert: {
          id?: string | null
          isAdmin?: boolean | null
          name?: string | null
        }
        Update: {
          id?: string | null
          isAdmin?: boolean | null
          name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_coach_id: { Args: never; Returns: string }
      current_student_id: { Args: never; Returns: string }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      scan_check_in: { Args: { p_code: string }; Returns: Json }
    }
    Enums: {
      AttendanceStatus: "PRESENT" | "ABSENT" | "LATE"
      CoachShiftStatus: "OPEN" | "PENDING" | "APPROVED" | "REJECTED"
      DayOfWeek: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN"
      EmergencyContactRelationship: "MOTHER" | "FATHER" | "GUARDIAN" | "OTHER"
      EnrollmentStatus: "ACTIVE" | "DROPPED"
      Level:
        | "P1"
        | "P2"
        | "P3"
        | "P4"
        | "P5"
        | "P6"
        | "SEC1"
        | "SEC2"
        | "SEC3"
        | "SEC4"
        | "SEC5"
        | "JC1"
        | "JC2"
      ProgressStatus: "PLANNED" | "COMPLETED"
      ReferralSource: "MAP_CLASS" | "SOCIAL_MEDIA" | "FRIENDS_FAMILY" | "OTHER"
      ShiftBlock: "WEEKDAY_EVENING" | "WEEKEND_MORNING" | "WEEKEND_AFTERNOON"
      StudentStatus: "ACTIVE" | "REMOVED" | "GRADUATED"
      Subject: "ENGLISH" | "MATH" | "SCIENCE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      AttendanceStatus: ["PRESENT", "ABSENT", "LATE"],
      CoachShiftStatus: ["OPEN", "PENDING", "APPROVED", "REJECTED"],
      DayOfWeek: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
      EmergencyContactRelationship: ["MOTHER", "FATHER", "GUARDIAN", "OTHER"],
      EnrollmentStatus: ["ACTIVE", "DROPPED"],
      Level: [
        "P1",
        "P2",
        "P3",
        "P4",
        "P5",
        "P6",
        "SEC1",
        "SEC2",
        "SEC3",
        "SEC4",
        "SEC5",
        "JC1",
        "JC2",
      ],
      ProgressStatus: ["PLANNED", "COMPLETED"],
      ReferralSource: ["MAP_CLASS", "SOCIAL_MEDIA", "FRIENDS_FAMILY", "OTHER"],
      ShiftBlock: ["WEEKDAY_EVENING", "WEEKEND_MORNING", "WEEKEND_AFTERNOON"],
      StudentStatus: ["ACTIVE", "REMOVED", "GRADUATED"],
      Subject: ["ENGLISH", "MATH", "SCIENCE"],
    },
  },
} as const
