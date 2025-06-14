"use client";
import Link from "next/link";
import { useState, useContext, useEffect } from "react";
import { StoreContainer } from "./index.style";
import { Input, Space } from "antd";
import { StoreContext } from "@/lib/StoreContextProvider.jsx";
import { BiSolidStore } from "react-icons/bi";

const { Search } = Input;

export default function Store() {
  const [id, setId] = useState(1);
  const { store, getStore } = useContext(StoreContext);
  const [ loading, setLoading ] = useState(false);

  useEffect(() => {
    setId(store.Store_ID);
    console.log("Store component mounted or store changed", store);
  }, [store]);

  const GetStore = async (id) => {
    setLoading(true);
    try {
      const data = await getStore(id);
      if (!data) {
        console.error("Store not found for ID:", id);
        return;
      }
      console.log("Store data retrieved:", data);
    } catch (error) {
      console.error("Error fetching store data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StoreContainer className="container">
      <h3>{store.Store_Name}</h3>
      {!store.Store_ID && <span className="note">请先链接相应店铺设置</span>}
      <div className="store-info">
        <Space.Compact>
          <Search
            addonBefore="ID"
            style={{ width: "14rem" }}
            value={id}
            onChange={(e) => setId(e.target.value)}
            onSearch={() => GetStore(id)}
            enterButton
            loading={loading}
          />
        </Space.Compact>
      </div>
      <h6>奖项</h6>
      <ul className="prize-list">
        {store.Prize.map((item, index) => (
          <li key={index}>
            <span className="name">{item.Name}: </span>
            <span className="quantity">{item.Quantity}</span>
          </li>
        ))}
        {store.Prize.length === 0 && "-"}
      </ul>
      <span className="min-spent">
        允许最小额度：¥{store.Min_Spent || " - "}
      </span>
      <span className="position">
        位置：
        {store.Position === "bottom" && "靠下 / bottom"}
        {store.Position === "center" && "剧中 / center"}
        {store.Position === "left" && "靠左 / left"}
        {store.Position === "right" && "靠右 / right"}
        {!store.Position && "-"}
      </span>
      <Link href="/" className="icon-store-settings">
        <BiSolidStore size={22} />
      </Link>
    </StoreContainer>
  );
}
