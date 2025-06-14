"use client";
import styled from "styled-components";

export const StoreContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  h3 {
    margin-bottom: 2rem;
  }

  span.note {
    display: inline-block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    font-size: 1.2rem;
  }

  .store-info {
    display: flex;
    gap: 1rem;
  }

  h6 {
    margin-top: 2rem;
  }

  .min-spent {
    display: block;
    margin-top: 1rem;
    font-weight: bold;
    background-color: rgba(0,0,0,0.1);
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .icon-store-settings {
    position: absolute;
    bottom: 2rem;
    right: 2rem;
    background-color: rgba(140,140,140,0.9);
    padding: 0.3rem;
    line-height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 0.5rem;
    color: #fff;
  }
`