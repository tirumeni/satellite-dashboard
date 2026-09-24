"""Earth Engine adapter placeholders. No authentication is performed."""


class EarthEngineService:
    def authenticate(self) -> dict:
        # TODO: Add server-side service account authentication after credentials are provisioned.
        return self._placeholder("authenticate")

    def loadSentinel(self, location: str = "") -> dict:
        # TODO: Load and filter Sentinel imagery once Earth Engine is configured.
        return self._placeholder("loadSentinel", location)

    def loadLandsat(self, location: str = "") -> dict:
        # TODO: Load and filter Landsat imagery once Earth Engine is configured.
        return self._placeholder("loadLandsat", location)

    def calculateNDVI(self) -> dict:
        # TODO: Calculate NDVI from the selected image collection.
        return self._placeholder("calculateNDVI")

    def calculateNDWI(self) -> dict:
        # TODO: Calculate NDWI from the selected image collection.
        return self._placeholder("calculateNDWI")

    def calculateNDBI(self) -> dict:
        # TODO: Calculate NDBI from the selected image collection.
        return self._placeholder("calculateNDBI")

    def detectFlood(self) -> dict:
        # TODO: Implement flood detection on verified SAR/optical inputs.
        return self._placeholder("detectFlood")

    def detectFire(self) -> dict:
        # TODO: Implement burned-area/fire change detection.
        return self._placeholder("detectFire")

    def detectUrbanExpansion(self) -> dict:
        # TODO: Implement multi-temporal urban expansion detection.
        return self._placeholder("detectUrbanExpansion")

    @staticmethod
    def _placeholder(operation: str, location: str = "") -> dict:
        return {"status": "not_configured", "operation": operation, "location": location, "data": None, "message": "Earth Engine integration is intentionally not configured."}


earth_engine = EarthEngineService()
