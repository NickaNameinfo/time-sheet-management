import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import commonData from "../../common.json";

import {
  Dialog,
  DialogTitle,
  TextField,
  TextareaAutosize,
} from "@mui/material";

export const Variations = () => {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [rowData, setRowData] = useState([]);
  const [selectedRows, setSelectedRows] = useState(null);
  const [open, setOpen] = React.useState(false);
  const [modalValue, setModalValue] = React.useState(null);

  const columnDefs = useMemo(
    () => [{ field: "variation", checkboxSelection: true }],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      editable: false,
      enableRowGroup: true,
      enablePivot: true,
      enableValue: true,
      checkboxSelection: true,
      sortable: true,
      resizable: true,
      filter: true,
      floatingFilter: true,
      flex: 1,
      minWidth: 100,
    }),
    []
  );

  const onGridReady = useCallback((params) => {
    axios
      .get(`${commonData?.APIKEY}/variation`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setRowData(res.data.Result);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  }, []);

  const handleDelete = (id) => {
    axios
      .delete(`${commonData?.APIKEY}/variation/delete/` + id)
      .then((res) => {
        if (res.data.Status === "Success") {
          window.location.reload(true);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  const onSelectionChanged = (event) => {
    const selectedItem = event.api.getSelectedRows();
    setSelectedRows(selectedItem);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleVariation = () => {
    axios
      .post(`${commonData?.APIKEY}/create/variation`, modalValue)
      .then((res) => {
        location.reload();
        setOpen(false);
      });
  };

  return (
    <>
      <div className="addBtn pb-1 my-3">
        <Link onClick={() => setOpen(true)} className="btn">
          Add
        </Link>
        {selectedRows?.length > 0 && (
          <Button
            variant="contained"
            onClick={() => handleDelete(selectedRows?.[0]?.id)}
          >
            Delete
          </Button>
        )}
      </div>
      <div style={containerStyle}>
        <div style={gridStyle} className="ag-theme-alpine">
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            suppressRowClickSelection={true}
            groupSelectsChildren={true}
            rowSelection={"single"}
            rowGroupPanelShow={"always"}
            pivotPanelShow={"always"}
            pagination={true}
            onGridReady={onGridReady}
            onSelectionChanged={(event) => onSelectionChanged(event)}
          />
        </div>
      </div>
      <Dialog
        fullWidth
        open={open}
        maxWidth="sm"
        onClose={handleClose}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle
          id="alert-dialog-title"
          className="d-flex align-items-center justify-content-between"
        >
          <h3>{`Add Area of Work`}</h3>
          <i
            class="fa-solid fa-xmark cursor-pointer"
            onClick={() => setOpen(false)}
            style={{ cursor: "pointer" }}
          ></i>
        </DialogTitle>
        <div className="px-3">
          <TextareaAutosize
            fullWidth
            variant="outlined"
            onChange={(e) => {
              setModalValue((prev) => ({
                variation: e.target.value,
              }));
            }}
            placeholder="Leave message"
            className="textarea"
          />
          <div>
            <button
              type="submit"
              className="btn btn-primary button mt-2"
              onClick={() => {
                handleVariation();
              }}
            >
              Submit
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
};
