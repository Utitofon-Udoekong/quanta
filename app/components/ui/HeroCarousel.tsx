"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"
import { Button } from "@headlessui/react"
import { Content } from "@/app/types"

interface CarouselItem {
  id: string
  title: string
  image: string
  user: string
  avatar: string
  views: string
  timeAgo: string
  gradient: string
  contentType: 'video' | 'audio' | 'article'
}

// Default carousel items - you can replace these with dynamic data
const defaultCarouselItems: CarouselItem[] = [
  {
    id: "1",
    title: "Frozen II",
    image: "/images/default-thumbnail.png",
    user: "DisneyOfficial",
    avatar: "https://robohash.org/disney",
    views: "2.1M",
    timeAgo: "2 years ago",
    gradient: "from-blue-600 to-purple-600",
    contentType: "video"
  },
  {
    id: "2",
    title: "Avengers Age of Ultron",
    image: "/images/default-thumbnail.png",
    user: "SilverToken",
    avatar: "https://robohash.org/silver",
    views: "67K",
    timeAgo: "9 hours ago",
    gradient: "from-purple-600 to-blue-600",
    contentType: "video"
  },
  {
    id: "3",
    title: "The Lion King",
    image: "/images/default-thumbnail.png",
    user: "MovieMaster",
    avatar: "https://robohash.org/lion",
    views: "1.8M",
    timeAgo: "1 week ago",
    gradient: "from-orange-500 to-red-600",
    contentType: "video"
  },
  {
    id: "4",
    title: "Spider-Man: No Way Home",
    image: "/images/default-thumbnail.png",
    user: "MarvelFan",
    avatar: "https://robohash.org/spider",
    views: "3.2M",
    timeAgo: "3 days ago",
    gradient: "from-red-600 to-blue-600",
    contentType: "video"
  },
  {
    id: "5",
    title: "Black Panther",
    image: "/images/default-thumbnail.png",
    user: "WakandaForever",
    avatar: "https://robohash.org/wakanda",
    views: "2.7M",
    timeAgo: "5 days ago",
    gradient: "from-purple-800 to-black",
    contentType: "video"
  },
]

interface HeroCarouselProps {
  items?: CarouselItem[]
  onItemClick?: (item: CarouselItem) => void
}

export default function HeroCarousel({ items = defaultCarouselItems, onItemClick }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [announcement, setAnnouncement] = useState("")
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [autoPlayInterval, setAutoPlayInterval] = useState(4000)
  const [showTimingControls, setShowTimingControls] = useState(false)

  const nextSlide = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }, [isAnimating, items.length])

  const prevSlide = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
  }, [isAnimating, items.length])

  const startAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    autoPlayRef.current = setInterval(() => {
      nextSlide()
    }, autoPlayInterval)
  }, [nextSlide, autoPlayInterval])

  const stopAutoPlay = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
      autoPlayRef.current = null
    }
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0) // Reset touchEnd
    setTouchStart(e.targetTouches[0].clientX)
    stopAutoPlay() // Stop auto-play when user starts touching
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      nextSlide()
    } else if (isRightSwipe) {
      prevSlide()
    }

    // Resume auto-play after a delay
    setTimeout(() => {
      if (isAutoPlaying) startAutoPlay()
    }, 2000)
  }

  const handleMouseEnter = () => {
    stopAutoPlay()
  }

  const handleMouseLeave = () => {
    if (isAutoPlaying) startAutoPlay()
  }

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying)
    if (!isAutoPlaying) {
      startAutoPlay()
    } else {
      stopAutoPlay()
    }
  }

  const handleItemClick = (item: CarouselItem) => {
    if (onItemClick) {
      onItemClick(item)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 500)
    return () => clearTimeout(timer)
  }, [currentIndex])

  useEffect(() => {
    if (isAutoPlaying) {
      startAutoPlay()
    } else {
      stopAutoPlay()
    }

    return () => stopAutoPlay()
  }, [isAutoPlaying, startAutoPlay, stopAutoPlay])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        prevSlide()
        stopAutoPlay()
        setTimeout(() => {
          if (isAutoPlaying) startAutoPlay()
        }, 2000)
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        nextSlide()
        stopAutoPlay()
        setTimeout(() => {
          if (isAutoPlaying) startAutoPlay()
        }, 2000)
      } else if (event.key === " " || event.key === "Enter") {
        if (event.target === carouselRef.current) {
          event.preventDefault()
          toggleAutoPlay()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [nextSlide, prevSlide, isAutoPlaying, startAutoPlay, stopAutoPlay])

  useEffect(() => {
    if (items.length === 0) return;
    
    const currentItem = items[currentIndex];
    if (!currentItem) return;
    
    setAnnouncement(
      `Now viewing ${currentItem.title} by ${currentItem.user}. Slide ${currentIndex + 1} of ${items.length}.`,
    )
  }, [currentIndex, items])

  // Reset currentIndex when items change to ensure it's valid
  useEffect(() => {
    if (currentIndex >= items.length && items.length > 0) {
      setCurrentIndex(0);
    }
  }, [items, currentIndex]);

  const getCardStyle = (index: number) => {
    const diff = index - currentIndex
    const absIndex = Math.abs(diff)

    // Simplified positioning for reduced motion
    if (prefersReducedMotion) {
      if (absIndex === 0) {
        return {
          transform: "translateX(0%) scale(1)",
          zIndex: 50,
          opacity: 1,
          filter: "none",
        }
      } else {
        return {
          transform: `translateX(${diff > 0 ? "100%" : "-100%"}) scale(0.9)`,
          zIndex: 10,
          opacity: 0.3,
          filter: "none",
        }
      }
    }

    // Original parallax effect for users who don't prefer reduced motion
    if (absIndex === 0) {
      return {
        transform: "translateX(0%) scale(1)",
        zIndex: 50,
        opacity: 1,
        filter: "blur(0px)",
      }
    } else if (absIndex === 1) {
      return {
        transform: `translateX(${diff > 0 ? "60%" : "-60%"}) scale(0.85)`,
        zIndex: 30,
        opacity: 0.7,
        filter: "blur(1px)",
      }
    } else if (absIndex === 2) {
      return {
        transform: `translateX(${diff > 0 ? "120%" : "-120%"}) scale(0.7)`,
        zIndex: 20,
        opacity: 0.4,
        filter: "blur(2px)",
      }
    } else {
      return {
        transform: `translateX(${diff > 0 ? "180%" : "-180%"}) scale(0.6)`,
        zIndex: 10,
        opacity: 0.2,
        filter: "blur(3px)",
      }
    }
  }

  return (
    <div
      className="relative w-full min-h-60 md:h-80 z-10"
      role="application"
      aria-label="Content carousel"
      aria-describedby="carousel-instructions"
    >
      {/* Background blur effect */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Screen reader instructions */}
      <div id="carousel-instructions" className="sr-only">
        Use arrow keys to navigate between content, space bar to toggle auto-play, or swipe on touch devices.
      </div>

      {/* Reduced motion indicator */}
      {prefersReducedMotion && (
        <div className="absolute top-4 left-4 z-50">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
            <div className="text-white/70 text-sm flex items-center gap-2">
              <span aria-hidden="true">🎭</span>
              <span>Reduced Motion</span>
            </div>
          </div>
        </div>
      )}

      {/* Live region for announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Carousel container */}
      <div
        ref={carouselRef}
        className="relative h-full flex items-center justify-center px-4 md:px-8"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="region"
        aria-label="Content carousel"
        tabIndex={0}
        aria-describedby="carousel-instructions"
      >
        {/* Navigation buttons */}
        <Button
          className="absolute left-2 md:left-4 z-50 h-8 w-8 md:h-10 md:w-10 rounded-full bg-black/30 hover:bg-black/50 text-white border border-white/20 flex items-center justify-center"
          onClick={() => {
            prevSlide()
            stopAutoPlay()
            setTimeout(() => {
              if (isAutoPlaying) startAutoPlay()
            }, 2000)
          }}
          disabled={isAnimating}
          aria-label="Previous content"
          aria-describedby="carousel-instructions"
        >
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
        </Button>

        <Button
          className="absolute right-2 md:right-4 z-50 h-8 w-8 md:h-10 md:w-10 rounded-full bg-black/30 hover:bg-black/50 text-white border border-white/20 flex items-center justify-center"
          onClick={() => {
            nextSlide()
            stopAutoPlay()
            setTimeout(() => {
              if (isAutoPlaying) startAutoPlay()
            }, 2000)
          }}
          disabled={isAnimating}
          aria-label="Next content"
          aria-describedby="carousel-instructions"
        >
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
        </Button>

        {/* Cards */}
        <div className="relative w-full max-w-2xl h-full aspect-video" role="group" aria-label="Content slides">
          {items.filter(item => item).map((item, index) => {
            const style = getCardStyle(index)
            const isCenter = index === currentIndex

            return (
              <div
                key={item.id}
                className={`absolute inset-0 ${prefersReducedMotion ? "transition-all duration-200" : "transition-all duration-500"} ease-out cursor-pointer`}
                style={style}
                onClick={() => {
                  if (!isCenter) {
                    setCurrentIndex(index)
                    stopAutoPlay()
                    setTimeout(() => {
                      if (isAutoPlaying) startAutoPlay()
                    }, 2000)
                  } else {
                    handleItemClick(item)
                  }
                }}
                role="tabpanel"
                aria-label={`${item.title} by ${item.user}`}
                aria-hidden={!isCenter}
                tabIndex={isCenter ? 0 : -1}
                aria-describedby={isCenter ? `slide-${item.id}-details` : undefined}
              >
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                  {/* Card image */}
                  <Image 
                    src={item.image || "/images/default-thumbnail.png"} 
                    alt={item.title} 
                    fill 
                    className="object-cover" 
                  />

                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${item.gradient} opacity-60`} />

                  {/* Content overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6 text-white">
                    {isCenter && (
                      <>
                        {/* User info */}
                        <div className="flex items-center gap-3 mb-2 md:mb-3" id={`slide-${item.id}-details`}>
                          <div className="h-7 w-7 md:h-8 md:w-8 rounded-full border-2 border-white/30 overflow-hidden">
                            <Image 
                              src={item.avatar || "https://robohash.org/default"} 
                              alt={`${item.user}'s profile picture`}
                              width={32} 
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-xs md:text-sm">
                            <div className="font-semibold" aria-label="Creator name">
                              {item.user}
                            </div>
                            <div className="text-white/70" aria-label="Content statistics">
                              {item.views} views • {item.timeAgo}
                            </div>
                          </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-lg md:text-2xl font-bold mb-3 md:mb-4" aria-label="Content title">
                          {item.title}
                        </h2>

                        {/* Action button */}
                        <Button 
                          className="w-fit bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-4 py-1.5 md:px-6 md:py-2 rounded-full shadow-lg flex items-center text-sm md:text-base"
                          aria-label={`${item.contentType === 'video' ? 'Watch' : item.contentType === 'audio' ? 'Listen to' : 'Read'} ${item.title}`}
                        >
                          <Play className="w-3 h-3 md:w-4 md:h-4 mr-2 fill-current" aria-hidden="true" />
                          {item.contentType === 'video' ? 'Watch' : item.contentType === 'audio' ? 'Listen' : 'Read'}
                        </Button>
                      </>
                    )}

                    {!isCenter && (
                      <div className="text-center">
                        <h3 className="text-base md:text-lg font-bold" aria-label="Content title">
                          {item.title}
                        </h3>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Dots indicator */}
      <div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2"
        role="tablist"
        aria-label="Content slides navigation"
      >
        {items.map((item, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? "bg-white w-6" : "bg-white/40 hover:bg-white/60 w-2"
            }`}
            onClick={() => setCurrentIndex(index)}
            role="tab"
            aria-selected={index === currentIndex}
            aria-label={`Go to ${item.title}`}
            aria-controls={`slide-${item.id}`}
            tabIndex={index === currentIndex ? 0 : -1}
          />
        ))}
      </div>

      {/* Auto-play and timing controls */}
      <div className="absolute bottom-4 right-2 md:right-4 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <Button
            className="hidden md:flex bg-black/30 hover:bg-black/50 text-white border border-white/20 rounded-full px-4 text-sm"
            onClick={toggleAutoPlay}
            aria-label={isAutoPlaying ? "Pause auto-play" : "Start auto-play"}
            aria-pressed={isAutoPlaying}
          >
            {isAutoPlaying ? "Pause" : "Play"}
          </Button>

          <Button
            className="hidden md:flex bg-black/30 hover:bg-black/50 text-white border border-white/20 rounded-full px-2 text-sm"
            onClick={() => setShowTimingControls(!showTimingControls)}
            aria-label="Auto-play timing settings"
            aria-expanded={showTimingControls}
          >
            ⚙️
          </Button>
        </div>

        {showTimingControls && (
          <div className="hidden md:block bg-black/50 backdrop-blur-sm rounded-lg p-4 border border-white/20 min-w-48">
            <div className="text-white text-sm mb-3 font-medium">Auto-play Speed</div>
            <div className="space-y-2">
              {[
                { label: "Fast (2s)", value: 2000 },
                { label: "Normal (4s)", value: 4000 },
                { label: "Slow (6s)", value: 6000 },
                { label: "Very Slow (10s)", value: 10000 },
              ].map((option) => (
                <button
                  key={option.value}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    autoPlayInterval === option.value
                      ? "bg-purple-600 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                  onClick={() => {
                    setAutoPlayInterval(option.value)
                    if (isAutoPlaying) {
                      stopAutoPlay()
                      setTimeout(() => startAutoPlay(), 100)
                    }
                  }}
                  aria-pressed={autoPlayInterval === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {prefersReducedMotion && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="text-white/70 text-xs">ℹ️ Reduced motion mode active</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6">
        {/* ...filter buttons... */}
      </div>
    </div>
  )
} 