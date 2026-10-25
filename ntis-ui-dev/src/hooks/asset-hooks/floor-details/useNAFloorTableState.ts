/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { fetchFloorDropdownOptions } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions";

interface UseNAFloorTableStateParams {
  floors: any[];
  typeId?: number;
  pageSize?: number;
}

export function useNAFloorTableState({
  floors,
  typeId,
  pageSize = 5,
}: UseNAFloorTableStateParams) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(floors.length / pageSize) || 1;

  const [dropdownOptions, setDropdownOptions] = useState<any>(null);

  useEffect(() => {
    if (typeId) {
      fetchFloorDropdownOptions(typeId).then((res) => {
        if (res.success) {
          setDropdownOptions(res.data);
        }
      });
    }
  }, [typeId]);

  const floorLevelMap = useMemo(() => {
    const map = new Map<string, string>();
    (dropdownOptions?.floorLevels || []).forEach((o: any) =>
      map.set(String(o.value), o.label)
    );
    return map;
  }, [dropdownOptions?.floorLevels]);

  const constructionTypeMap = useMemo(() => {
    const map = new Map<string, string>();
    (dropdownOptions?.constructionTypes || []).forEach((o: any) =>
      map.set(String(o.value), o.label)
    );
    return map;
  }, [dropdownOptions?.constructionTypes]);

  const useTypeMap = useMemo(() => {
    const map = new Map<string, string>();
    (dropdownOptions?.useTypes || []).forEach((o: any) =>
      map.set(String(o.value), o.label)
    );
    return map;
  }, [dropdownOptions?.useTypes]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setTimeout(() => { setCurrentPage(totalPages); }, 0);
    }
  }, [floors.length, totalPages, currentPage]);

  const paginatedFloors = useMemo(() => {
    return floors.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [floors, currentPage, pageSize]);

  const [scrollDirection, setScrollDirection] = useState<"left" | "right">(
    "right"
  );

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -250, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 250, behavior: "smooth" });
    }
  };

  const handleChevronScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      if (scrollDirection === "right") {
        container.scrollBy({ left: 300, behavior: "smooth" });
      } else {
        container.scrollBy({ left: -300, behavior: "smooth" });
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        if (
          container.scrollLeft + container.clientWidth >=
          container.scrollWidth - 30
        ) {
          setScrollDirection("left");
        } else if (container.scrollLeft <= 30) {
          setScrollDirection("right");
        }
      }
    };
    const currentContainer = scrollContainerRef.current;
    if (currentContainer) {
      currentContainer.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (currentContainer) {
        currentContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return {
    scrollContainerRef,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedFloors,
    floorLevelMap,
    constructionTypeMap,
    useTypeMap,
    scrollDirection,
    scrollLeft,
    scrollRight,
    handleChevronScroll,
  };
}
