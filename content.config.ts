import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    universities: defineCollection({
      type: 'data',
      source: 'universities.csv',
      schema: z.object({
        id: z.number(),
        world_rank: z.string(),
        university_name: z.string(),
        country: z.string(),
        teaching: z.number().optional(),
        international: z.number().optional(),
        research: z.number().optional(),
        citations: z.number().optional(),
        income: z.number().optional(),
        total_score: z.number().optional(),
        num_students: z.number().optional(),
        student_staff_ratio: z.number().optional(),
        international_students: z.string().optional(),
        female_male_ratio: z.string().optional(),
        year: z.number()
      })
    })
  }
})