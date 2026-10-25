import React from "react";
import AgeFactorCvWeightageMaster from "./AgeFactorCvWeightageMaster";
import { AgeFactorCVMaster } from "@/types/ageFactorCv.types";
import { Option } from "@/components/common/select";

interface AgeFactorCvBuildingProps {
    data: AgeFactorCVMaster[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    assessmentYearOptions: Option[];
    constructionTypeOptions: Option[];
    ageRangeOptions: Option[];
    allAgeFactors: AgeFactorCVMaster[];
}

/**
 * @deprecated Use AgeFactorCvWeightageMaster instead.
 * This component is kept for backward compatibility and wraps the modularized AgeFactorCvWeightageMaster.
 */
const AgeFactorCvBuilding: React.FC<AgeFactorCvBuildingProps> = (props) => {
    return <AgeFactorCvWeightageMaster {...props} />;
};

export default AgeFactorCvBuilding;
