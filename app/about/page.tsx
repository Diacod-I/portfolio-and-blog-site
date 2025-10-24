'use client'

import NoteWindow from '@/components/NoteWindow'

export default function AboutPage() {
  return (
    <NoteWindow title="About Me">
      <div className="max-w-2xl text-white mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-2">About Me</h1>
        <p>
          {/* TODO: Add a brief introduction about yourself here. */}
          [Your introduction goes here. Who are you? What drives you?]
        </p>
        <h2 className="text-xl font-bold mt-6 mb-2">My Experience</h2>
        <p>
          {/* TODO: Summarize your professional experience, key roles, and industries. */}
          [Describe your work experience, notable positions, and industries you've worked in.]
        </p>
        <h2 className="text-xl font-bold mt-6 mb-2">My Work</h2>
        <p>
          {/* TODO: Highlight your major projects, achievements, and skills. */}
          [Showcase your technical skills, and any achievements or recognitions.]
        </p>
        <h2 className="text-xl font-bold mt-6 mb-2">My Recommendations</h2>
        <p>
          {/* Recommendations */}
          [Show recommendations]
        </p>
        <h2 className="text-xl font-bold mt-6 mb-2">More About Me</h2>
        <p>
          {/* TODO: Add personal interests, values, or fun facts. */}
          [Share your interests, values, hobbies, or anything unique about yourself.]
        </p>
      </div>
    </NoteWindow>
  )
}
