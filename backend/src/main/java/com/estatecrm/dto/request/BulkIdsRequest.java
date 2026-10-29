package com.estatecrm.dto.request;

import javax.validation.constraints.NotEmpty;
import java.util.List;

public class BulkIdsRequest {

    @NotEmpty(message = "At least one ID must be provided")
    private List<Long> ids;

    public BulkIdsRequest() {}

    public BulkIdsRequest(List<Long> ids) {
        this.ids = ids;
    }

    public List<Long> getIds() { return ids; }
    public void setIds(List<Long> ids) { this.ids = ids; }
}
