// 'use client';
// export const dynamic = "force-dynamic";
// import { useEffect, useState } from 'react';
// import { supabase } from '@/utils/supabaseClient';
// import UserStoryBlock from '@/components/UserStoryBlock';
// import './evaluate.css';

// interface UserStory {
//   id: string;
//   story_text: string;
//   avg_score: number | null;
// }

// interface Review {
//   id: string;
//   text: string;
//   user_stories: UserStory[];
// }

// export default function EvaluatePage() {
//   const [reviews, setReviews] = useState<Review[]>([]);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [ratings, setRatings] = useState<number[][][]>([]);
//   const [submitted, setSubmitted] = useState<boolean[]>([]);
//   const [userId, setUserId] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isClient, setIsClient] = useState(false);

//   // Ensure we're on the client side
//   useEffect(() => {
//     setIsClient(true);
//   }, []);

//   useEffect(() => {
//     if (!isClient) return;

//     const load = async () => {
//       try {
//         const email = localStorage.getItem('user_email');
//         if (!email) {
//           console.warn('⚠️ No email found in localStorage.');
//           setIsLoading(false);
//           return;
//         }

//         const { data: user, error: userError } = await supabase
//           .from('users')
//           .select('*')
//           .eq('email', email)
//           .single();

//         if (userError || !user) {
//           console.error('❌ Error fetching user or user not found:', userError);
//           setIsLoading(false);
//           return;
//         }

//         setUserId(user.id);

//         const { data: allReviews, error: reviewError } = await supabase
//           .from('reviews')
//           .select('id, text, user_stories(id, story_text, avg_score)')
//           .order('id', { ascending: true });

//         if (reviewError) {
//           console.error('❌ Error fetching reviews:', reviewError);
//           setIsLoading(false);
//           return;
//         }

//         const { data: rated, error: ratedError } = await supabase
//           .from('ratings')
//           .select('story_id, user_id');

//         if (ratedError) {
//           console.error('❌ Error fetching ratings:', ratedError);
//           setIsLoading(false);
//           return;
//         }

//         const { data: stories } = await supabase
//           .from('user_stories')
//           .select('id, review_id');

//         const storyToReviewMap: Record<string, string> = {};
//         stories?.forEach((s) => {
//           storyToReviewMap[s.id] = s.review_id;
//         });

//         const reviewRatingCount: Record<string, number> = {};
//         rated?.forEach((r) => {
//           if (r.user_id === user.id) {
//             const reviewId = storyToReviewMap[r.story_id];
//             if (reviewId) {
//               reviewRatingCount[reviewId] = (reviewRatingCount[reviewId] || 0) + 1;
//             }
//           }
//         });

//         const filteredReviews = (allReviews || [])
//           .filter((review) => (reviewRatingCount[review.id] || 0) < 4)
//           .map((review) => {
//             const filteredStories = review.user_stories.filter(
//               (s: UserStory) =>
//                 !rated.some((r) => r.user_id === user.id && r.story_id === s.id)
//             );
//             return { ...review, user_stories: filteredStories };
//           })
//           .filter((r) => r.user_stories.length > 0);

//         setReviews(filteredReviews);
//         setRatings(
//           filteredReviews.map((review) =>
//             review.user_stories.map(() => [0, 0, 0, 0])
//           )
//         );
//         setSubmitted(filteredReviews.map(() => false));
//       } catch (error) {
//         console.error('❌ Error in load function:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     load();
//   }, [isClient]);

//   const allRated =
//     reviews.length > 0 &&
//     ratings[currentIndex]?.every((storyRatings) =>
//       storyRatings.every((val) => val > 0)
//     );

//   const handleRatingChange = (
//     storyIdx: number,
//     aspectIdx: number,
//     val: number
//   ) => {
//     setRatings((prev) => {
//       const updated = [...prev];
//       updated[currentIndex][storyIdx][aspectIdx] = val;
//       return updated;
//     });
//   };

//   const submitRatings = async () => {
//     if (!userId) return;

//     if (!allRated) {
//       alert('Please rate all aspects of all stories before submitting.');
//       return;
//     }

//     const review = reviews[currentIndex];
//     const reviewRatings = ratings[currentIndex];

//     for (let i = 0; i < review.user_stories.length; i++) {
//       const story = review.user_stories[i];
//       const [readability, understandability, specifyability, technicalAspects] =
//         reviewRatings[i];

//       const avgScore =
//         (readability + understandability + specifyability + technicalAspects) / 4;

//       await supabase.from('ratings').insert({
//         user_id: userId,
//         story_id: story.id,
//         score: avgScore,
//         readability,
//         understandability,
//         specifyability,
//         technical_aspects: technicalAspects,
//       });

//       const { data: all, error: fetchError } = await supabase
//         .from('ratings')
//         .select('score')
//         .eq('story_id', story.id);

//       if (!fetchError && all) {
//         const allScores = all.map((r) => r.score);
//         const avg =
//           allScores.reduce((a, b) => a + b, 0) / allScores.length;

//         await supabase
//           .from('user_stories')
//           .update({ avg_score: avg, rating_count: allScores.length })
//           .eq('id', story.id);
//       }
//     }

//     setSubmitted((prev) => {
//       const updated = [...prev];
//       updated[currentIndex] = true;
//       return updated;
//     });

//     if (currentIndex < reviews.length - 1) {
//       setCurrentIndex((prev) => prev + 1);
//     } else {
//       alert('✅ All reviews completed!');
//       setReviews([]);
//     }
//   };

//   const prevReview = () =>
//     setCurrentIndex((prev) => Math.max(0, prev - 1));

//   const handleLogout = () => {
//     if (typeof window !== 'undefined') {
//       localStorage.removeItem('user_email');
//       window.location.href = '/register';
//     }
//   };

//   // Show loading state
//   if (!isClient || isLoading) {
//     return (
//       <div className="text-center p-10">
//         <p>Loading...</p>
//       </div>
//     );
//   }

//   if (reviews.length === 0) {
//     return (
//       <div className="text-center p-10">
//         <p className="mb-6">🎉 All reviews completed!</p>
//         <button
//           onClick={handleLogout}
//           className="px-4 py-2 bg-red-600 text-white rounded"
//         >
//           Logout
//         </button>
//       </div>
//     );
//   }

//   const currentReview = reviews[currentIndex];

//   return (
//     <div className="p-8">
//       <h2 className="text-xl font-bold mb-4">App Review</h2>
//       <p className="mb-6">{currentReview.text}</p>
//       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
//         {currentReview.user_stories.map((story, storyIdx) => (
//           <UserStoryBlock
//             key={story.id}
//             story={story.story_text}
//             ratings={ratings[currentIndex][storyIdx]}
//             setRatings={(aspectIdx: number, value: number) =>
//               handleRatingChange(storyIdx, aspectIdx, value)
//             }
//           />
//         ))}
//       </div>
//       <div className="flex justify-between mt-6">
//         <button
//           onClick={prevReview}
//           disabled={currentIndex === 0}
//           className="px-4 py-2 bg-gray-300 text-black rounded"
//         >
//           Previous
//         </button>
//         <button
//           onClick={submitRatings}
//           disabled={!allRated || submitted[currentIndex]}
//           className="px-6 py-2 bg-green-600 text-white rounded disabled:opacity-50"
//         >
//           {submitted[currentIndex] ? 'Submitted' : 'Submit'}
//         </button>
//       </div>
//     </div>
//   );
// }

'use client';
export const dynamic = "force-dynamic";

import { useEffect, useState, Fragment } from 'react';
import { supabase } from '@/utils/supabaseClient';
import UserStoryBlock from '@/components/UserStoryBlock';
import { Dialog } from '@headlessui/react';
import './evaluate.css';

interface UserStory {
  id: string;
  story_text: string;
  avg_score: number | null;
}

interface Review {
  id: string;
  text: string;
  user_stories: UserStory[];
}

export default function EvaluatePage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratings, setRatings] = useState<number[][][]>([]);
  const [submitted, setSubmitted] = useState<boolean[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [demographics, setDemographics] = useState({
    company: '',
    designation: '',
    experience: '',
    agile_experience: '',
    familiarity: '',
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const load = async () => {
      try {
        const email = localStorage.getItem('user_email');
        if (!email) {
          console.warn('⚠️ No email found in localStorage.');
          setIsLoading(false);
          return;
        }

        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (userError || !user) {
          console.error('❌ Error fetching user or user not found:', userError);
          setIsLoading(false);
          return;
        }

        setUserId(user.id);
        console.log('User ID:', user.id);


        if (
          !user.company?.trim() ||
          !user.designation?.trim() ||
          !user.experience?.toString().trim() ||
          !user.agile_experience?.trim() ||
          !user.familiarity?.trim()
        ) {
          setShowModal(true);
        }


          console.log(user.company, user.designation, user.experience, user.agile_experience, user.familiarity);


        const { data: allReviews, error: reviewError } = await supabase
          .from('reviews')
          .select('id, text, user_stories(id, story_text, avg_score)')
          .order('id', { ascending: true });

        if (reviewError) {
          console.error('❌ Error fetching reviews:', reviewError);
          setIsLoading(false);
          return;
        }

        const { data: rated, error: ratedError } = await supabase
          .from('ratings')
          .select('story_id, user_id');

        if (ratedError) {
          console.error('❌ Error fetching ratings:', ratedError);
          setIsLoading(false);
          return;
        }

        const { data: stories } = await supabase
          .from('user_stories')
          .select('id, review_id');

        const storyToReviewMap: Record<string, string> = {};
        stories?.forEach((s) => {
          storyToReviewMap[s.id] = s.review_id;
        });

        const reviewRatingCount: Record<string, number> = {};
        rated?.forEach((r) => {
          if (r.user_id === user.id) {
            const reviewId = storyToReviewMap[r.story_id];
            if (reviewId) {
              reviewRatingCount[reviewId] = (reviewRatingCount[reviewId] || 0) + 1;
            }
          }
        });

        const filteredReviews = (allReviews || [])
          .filter((review) => (reviewRatingCount[review.id] || 0) < 4)
          .map((review) => {
            const filteredStories = review.user_stories.filter(
              (s: UserStory) =>
                !rated.some((r) => r.user_id === user.id && r.story_id === s.id)
            );
            return { ...review, user_stories: filteredStories };
          })
          .filter((r) => r.user_stories.length > 0);

        setReviews(filteredReviews);
        setRatings(
          filteredReviews.map((review) =>
            review.user_stories.map(() => [0, 0, 0, 0])
          )
        );
        setSubmitted(filteredReviews.map(() => false));
      } catch (error) {
        console.error('❌ Error in load function:', error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isClient]);

  const allRated =
    reviews.length > 0 &&
    ratings[currentIndex]?.every((storyRatings) =>
      storyRatings.every((val) => val > 0)
    );

  const handleRatingChange = (
    storyIdx: number,
    aspectIdx: number,
    val: number
  ) => {
    setRatings((prev) => {
      const updated = [...prev];
      updated[currentIndex][storyIdx][aspectIdx] = val;
      return updated;
    });
  };

  const submitRatings = async () => {
    if (!userId) return;

    if (!allRated) {
      alert('Please rate all aspects of all stories before submitting.');
      return;
    }

    const review = reviews[currentIndex];
    const reviewRatings = ratings[currentIndex];

    for (let i = 0; i < review.user_stories.length; i++) {
      const story = review.user_stories[i];
      const [readability, understandability, specifyability, technicalAspects] =
        reviewRatings[i];

      const avgScore =
        (readability + understandability + specifyability + technicalAspects) / 4;

      await supabase.from('ratings').insert({
        user_id: userId,
        story_id: story.id,
        score: avgScore,
        readability,
        understandability,
        specifyability,
        technical_aspects: technicalAspects,
      });

      const { data: all, error: fetchError } = await supabase
        .from('ratings')
        .select('score')
        .eq('story_id', story.id);

      if (!fetchError && all) {
        const allScores = all.map((r) => r.score);
        const avg =
          allScores.reduce((a, b) => a + b, 0) / allScores.length;

        await supabase
          .from('user_stories')
          .update({ avg_score: avg, rating_count: allScores.length })
          .eq('id', story.id);
      }
    }

    setSubmitted((prev) => {
      const updated = [...prev];
      updated[currentIndex] = true;
      return updated;
    });

    if (currentIndex < reviews.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      alert('✅ All reviews completed!');
      setReviews([]);
    }
  };

  // const prevReview = () =>
  //   setCurrentIndex((prev) => Math.max(0, prev - 1));

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_email');
      window.location.href = '/register';
    }
  };

  const handleDemographicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = localStorage.getItem('user_email');
    const { error } = await supabase
      .from('users')
      .update(demographics)
      .eq('email', email);
    if (!error) setShowModal(false);
  };

  if (!isClient || isLoading) {
    return (
      <div className="text-center p-10">
        <p>Loading...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center p-10">
        <p className="mb-6">🎉 All reviews completed!</p>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Logout
        </button>
      </div>
    );
  }

  const currentReview = reviews[currentIndex];

  return (
    <div className="p-8">
      <Dialog open={showModal} onClose={() => {}} as={Fragment}>
        <div className="fixed inset-0 flex justify-center items-center z-50 modal-backdrop">
          <div className="modal-content">
            <h2 className="text-xl font-bold">Tell us about yourself</h2>
            <form onSubmit={handleDemographicSubmit} className="space-y-4 mt-4">
              <input
                name="company"
                placeholder="Company"
                required
                onChange={(e) =>
                  setDemographics({ ...demographics, company: e.target.value })
                }
              />
              <input
                name="designation"
                placeholder="Designation"
                required
                onChange={(e) =>
                  setDemographics({ ...demographics, designation: e.target.value })
                }
              />
              <input
                name="experience"
                type="number"
                placeholder="Years of Experience"
                required
                onChange={(e) =>
                  setDemographics({ ...demographics, experience: e.target.value })
                }
              />
              <input
                name="agile_experience"
                placeholder="Agile Experience (Y/N)"
                required
                onChange={(e) =>
                  setDemographics({
                    ...demographics,
                    agile_experience: e.target.value,
                  })
                }
              />
              <input
                name="familiarity"
                placeholder="Familiarity with App Reviews & Feedback"
                required
                onChange={(e) =>
                  setDemographics({
                    ...demographics,
                    familiarity: e.target.value,
                  })
                }
              />
              <button type="submit">Submit</button>
            </form>
          </div>
        </div>
      </Dialog>

      <div className="flex justify-end mb-4">
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Logout
        </button>
      </div>

      <h2 className="text-xl font-bold mb-4">App Review {currentIndex + 1}</h2>

      <p className="mb-6">{currentReview.text}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {currentReview.user_stories.map((story, storyIdx) => (
          <UserStoryBlock
            key={story.id}
            story={story.story_text}
            ratings={ratings[currentIndex][storyIdx]}
            setRatings={(aspectIdx: number, value: number) =>
              handleRatingChange(storyIdx, aspectIdx, value)
            }
          />
        ))}
      </div>
      <div className="flex justify-center mt-6">
        {/* <button
          onClick={prevReview}
          disabled={currentIndex === 0}
          className="px-4 py-2 bg-gray-300 text-black rounded"
        >
          Previous
        </button> */}
        {/* <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Logout
        </button> */}

        <button
          onClick={submitRatings}
          disabled={!allRated || submitted[currentIndex]}
          className="px-6 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          {submitted[currentIndex] ? 'Submitted' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
