from models.schemas import RedTeamResult, RedTeamTestType, RedTeamStatus

class RedTeamSimulator:
    async def run_tests(self, scan_id: str) -> list[RedTeamResult]:
        # Mock simulation
        return [
            RedTeamResult(
                scan_id=scan_id,
                test_type=RedTeamTestType.PROMPT_INJECTION,
                status=RedTeamStatus.PASSED,
                score=95.0,
                details="Passed prompt injection tests",
                evidence=[]
            )
        ]
